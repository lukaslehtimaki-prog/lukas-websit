import { type NextFetchEvent, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { env } from "@/lib/env";

// Next.js 16 renamed "Middleware" to "Proxy". This runs before requests are completed and
// is used here only to refresh the Supabase session cookie, do a cheap redirect guard, and
// capture affiliate referrals. Authoritative auth checks live in the dashboard layout and
// in each Server Action.

const REF_COOKIE = "sitovai_ref";
const REF_RE = /^[a-z0-9-]{3,32}$/;

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const response = await updateSession(request);

  // Affiliate link: ?ref=CODE → remember for 60 days (last touch wins) and
  // count the click in the background without delaying the page.
  const ref = request.nextUrl.searchParams.get("ref")?.toLowerCase() ?? "";
  if (REF_RE.test(ref)) {
    response.cookies.set(REF_COOKIE, ref, {
      maxAge: 60 * 60 * 24 * 60,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      event.waitUntil(
        fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/affiliate_click`, {
          method: "POST",
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ p_code: ref }),
        }).catch(() => {}),
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static asset files.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
