import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Refreshes the Supabase auth cookie on every request and applies a lightweight redirect
 * guard for the /dashboard area. Based on Supabase's official Next.js pattern, adapted for
 * the Next 16 Proxy convention.
 *
 * NOTE: Per the Next.js docs, Proxy must not be the only authorization layer — the
 * dashboard layout (requireTenantContext) and Server Actions re-check auth server-side.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Before the project is configured, don't block any routes.
  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalidates the token with the Auth server. Do not trust getSession() here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // A redirect response must carry over any refreshed auth cookies Supabase
  // just set on supabaseResponse — otherwise a token rotation during a
  // redirecting request is lost and the user gets silently logged out.
  const redirectTo = (pathname: string, search?: [string, string]) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    if (search) url.searchParams.set(search[0], search[1]);
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && path.startsWith("/dashboard")) {
    return redirectTo("/login", ["redirectTo", path]);
  }

  if (user && (path === "/login" || path === "/signup")) {
    return redirectTo("/dashboard");
  }

  return supabaseResponse;
}
