/**
 * Plan limits + pricing. Mirrored by the `plans` seed in
 * supabase/migrations/0002_billing.sql.
 *
 * Free = read-only (0 new searches / sites). Access requires an active or trialing
 * subscription — see src/lib/subscription.ts.
 */
export const PLAN_LIMITS = {
  free: { label: "Free", searches: 0, sites: 0, videos: 0, priceCents: 0 },
  pro: { label: "Standard", searches: 50, sites: 15, videos: 15, priceCents: 2000 },
  premium: { label: "Pro", searches: 5000, sites: 500, videos: 100, priceCents: 10000 },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

export const PAID_PLANS: PlanId[] = ["pro", "premium"];
export const TRIAL_DAYS = 7;

export function planLimits(planId: string) {
  return PLAN_LIMITS[planId as PlanId] ?? PLAN_LIMITS.free;
}

export function eur(cents: number): string {
  return `€${Math.round(cents / 100)}`;
}
