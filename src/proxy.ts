import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { env } from "@/lib/env";

// Next.js 16 renamed "Middleware" to "Proxy". This runs before requests are completed and
// is used here only to refresh the Supabase session cookie, do a cheap redirect guard, and
// capture affiliate referrals. Authoritative auth checks live in the dashboard layout and
// in each Server Action.

const REF_COOKIE = "sitagio_ref";
const REF_RE = /^[a-z0-9-]{3,32}$/;

/** Hosts that serve the Sitagio app itself (everything else is a client domain). */
function isAppHost(host: string): boolean {
  const h = host.split(":")[0];
  return (
    h === "sitagio.com" ||
    h.endsWith(".sitagio.com") ||
    h.endsWith(".vercel.app") ||
    h === "localhost" ||
    h === "127.0.0.1"
  );
}

/** Look up the published site attached to a custom domain. */
async function siteIdForDomain(host: string): Promise<string | null> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const url =
      `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sites` +
      `?select=id,status&content->>customDomain=eq.${encodeURIComponent(host)}&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { id: string; status: string }[];
    const row = rows[0];
    return row && row.status === "published" ? row.id : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // A client's custom domain serves that client's site, nothing else.
  const host = (request.headers.get("host") ?? "").toLowerCase();
  if (host && !isAppHost(host)) {
    const siteId = await siteIdForDomain(host.split(":")[0]);
    if (siteId) {
      const url = request.nextUrl.clone();
      url.pathname = `/s/${siteId}`;
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }

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
