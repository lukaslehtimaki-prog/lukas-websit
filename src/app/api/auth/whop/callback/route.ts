import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCode, fetchUserInfo } from "@/lib/whop-oauth";

export const runtime = "nodejs";

/**
 * Whop redirects here after consent. We swap the code for the buyer's Whop identity
 * and give them a Sitagio session on that same email, so the address can never drift
 * from the one they paid with.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (why: string) => NextResponse.redirect(`${origin}/login?error=${why}`);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return fail("whop_missing_code");

  const jar = await cookies();
  const expectedState = jar.get("whop_state")?.value;
  const verifier = jar.get("whop_verifier")?.value;
  if (!expectedState || !verifier || state !== expectedState) return fail("whop_bad_state");

  let email: string;
  let whopUserId: string;
  try {
    const accessToken = await exchangeCode(code, verifier);
    const info = await fetchUserInfo(accessToken);
    if (!info.email) return fail("whop_no_email");
    email = info.email.trim().toLowerCase();
    whopUserId = info.sub;
  } catch (e) {
    console.error("whop oauth callback failed:", e);
    return fail("whop_exchange_failed");
  }

  try {
    const admin = createAdminClient();

    // First sign-in creates the account; handle_new_user() builds the tenant and
    // claims any Whop entitlement already waiting on this email.
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (!found) {
      const { error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true, // Whop already verified it
        user_metadata: { whop_user_id: whopUserId },
      });
      if (error) throw error;
    }

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !link?.properties?.hashed_token) throw linkErr ?? new Error("no token");

    const supabase = await createClient();
    const { error: otpErr } = await supabase.auth.verifyOtp({
      token_hash: link.properties.hashed_token,
      type: "email",
    });
    if (otpErr) throw otpErr;
  } catch (e) {
    console.error("whop oauth session failed:", e);
    return fail("whop_session_failed");
  }

  const res = NextResponse.redirect(`${origin}/dashboard`);
  for (const c of ["whop_state", "whop_nonce", "whop_verifier"]) {
    res.cookies.set(c, "", { path: "/", maxAge: 0 });
  }
  return res;
}
