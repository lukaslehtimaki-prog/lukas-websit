import "server-only";
import { createClient } from "@/lib/supabase/server";
import { effectiveLimits } from "@/lib/subscription";

export type UsageKind = "lead_search" | "site_generation" | "avatar_video";

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

/**
 * This calendar month's usage of a kind for the current tenant (RLS-scoped).
 * Sums event quantities — batch kinds (avatar_video) record one event per batch
 * with quantity = batch size; the others always use quantity 1.
 */
export async function getMonthlyUsage(kind: UsageKind): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("usage_events")
    .select("quantity")
    .eq("kind", kind)
    .gte("created_at", startOfMonthISO());
  return (data ?? []).reduce((sum, e) => sum + (e.quantity ?? 1), 0);
}

export async function recordUsage(
  tenantId: string,
  userId: string,
  kind: UsageKind,
  quantity = 1,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("usage_events").insert({
    tenant_id: tenantId,
    user_id: userId,
    kind,
    quantity,
    metadata: metadata ?? null,
  });
}

export type LimitCheck = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
};

export async function checkLimit(
  planId: string,
  status: string,
  isPlatformAdmin: boolean,
  kind: UsageKind,
): Promise<LimitCheck> {
  const limits = effectiveLimits(planId, status, isPlatformAdmin);
  const limit =
    kind === "lead_search"
      ? limits.searches
      : kind === "avatar_video"
        ? limits.videos
        : limits.sites;
  const used = await getMonthlyUsage(kind);
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}
