import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Sliding-window rate limiting for the credential endpoints.
 *
 * Backed by public.auth_rate_limits + auth_rate_limit_hit() (migration 0012),
 * called with the service-role key so nothing is client-reachable.
 *
 * FAILS OPEN by design: if Supabase is unreachable, the service-role key is
 * missing, or the migration has not been applied yet, sign-in must not break.
 * A limiter outage is an availability problem, not a security one — the
 * platform-level GoTrue limits still apply underneath.
 */

export type RateLimitRule = { limit: number; windowSeconds: number };

/** Per-email attempts: slow down credential stuffing against one account. */
export const PER_EMAIL: RateLimitRule = { limit: 5, windowSeconds: 15 * 60 };
/** Per-IP attempts: slow down spraying across many accounts from one source. */
export const PER_IP: RateLimitRule = { limit: 20, windowSeconds: 60 * 60 };

/** Best-effort client IP from the proxy headers Vercel sets. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("cf-connecting-ip")?.trim() ||
    "";
  return ip || "unknown";
}

async function hit(key: string, rule: RateLimitRule): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("auth_rate_limit_hit", {
      p_key: key,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });
    if (error) return true; // migration not applied / transient — fail open
    return data !== false;
  } catch {
    return true;
  }
}

/**
 * Counts one attempt at `scope` for this email and this IP.
 * Returns a human-readable error string when the caller should be blocked,
 * or null when it may proceed.
 */
export async function checkAuthRateLimit(
  scope: "signin" | "signup" | "reset",
  email: string,
): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const ip = await clientIp();

  const [emailOk, ipOk] = await Promise.all([
    normalizedEmail
      ? hit(`${scope}:email:${normalizedEmail}`, PER_EMAIL)
      : Promise.resolve(true),
    hit(`${scope}:ip:${ip}`, PER_IP),
  ]);

  if (emailOk && ipOk) return null;
  return "Too many attempts. Wait a few minutes and try again.";
}
