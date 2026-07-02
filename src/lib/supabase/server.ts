import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and Server Actions.
 * It reads/writes the auth cookies so the user's session — and therefore RLS — is applied
 * to every query. (Next 16: `cookies()` is async.)
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only. Safe to ignore:
            // the middleware refreshes the session cookie on every request.
          }
        },
      },
    },
  );
}
