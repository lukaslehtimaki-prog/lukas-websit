import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, platformAdminEmails } from "@/lib/env";

export type TenantContext = {
  userId: string;
  email: string | null;
  fullName: string | null;
  isPlatformAdmin: boolean;
  tenantId: string;
  tenantName: string;
  role: "owner" | "admin" | "member";
  planId: string;
  subscriptionStatus: string;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
};

/**
 * Resolves the signed-in user's tenant context via the RLS-enforced Supabase client.
 * In v1 each user belongs to exactly one tenant (auto-provisioned at signup). Returns null
 * when there is no authenticated user.
 *
 * Wrapped in React cache() so the layout and page (and anything else in the same
 * request) share ONE resolution instead of each paying the full query cost.
 */
export const getTenantContext = cache(
  async (): Promise<TenantContext | null> => {
    if (!isSupabaseConfigured()) return null;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Profile and membership are independent — fetch them in parallel. The
    // tenant join carries the subscription fields too, so this is 2 sequential
    // steps total (getUser, then this pair) instead of the old 4.
    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase
        .from("profiles")
        .select("email, full_name, is_platform_admin")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("memberships")
        .select(
          "role, tenant:tenants(id, name, plan_id, subscription_status, trial_end, current_period_end)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    // The embedded `tenant` may come back as an object or a single-element array.
    const tenantRaw = membership?.tenant;
    const tenant = Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw;

    const email = profile?.email ?? user.email ?? null;
    const isPlatformAdmin =
      (profile?.is_platform_admin ?? false) ||
      (email ? platformAdminEmails().includes(email.toLowerCase()) : false);

    return {
      userId: user.id,
      email,
      fullName: profile?.full_name ?? null,
      isPlatformAdmin,
      tenantId: tenant?.id ?? "",
      tenantName: tenant?.name ?? "",
      role: (membership?.role as TenantContext["role"]) ?? "owner",
      planId: tenant?.plan_id ?? "free",
      subscriptionStatus: tenant?.subscription_status ?? "none",
      trialEnd: tenant?.trial_end ?? null,
      currentPeriodEnd: tenant?.current_period_end ?? null,
    };
  },
);

/** Same as getTenantContext() but redirects to /login when unauthenticated. */
export async function requireTenantContext(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx) redirect("/login");
  return ctx;
}
