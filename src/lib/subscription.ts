import { planLimits } from "@/lib/plans";

/** A tenant can use the product only while trialing or active. */
export function hasActiveSubscription(status: string | null | undefined): boolean {
  return status === "trialing" || status === "active";
}

/**
 * Effective monthly limits. Real plan limits while trialing/active; read-only (0/0)
 * otherwise. Platform admins always get full (premium) access.
 */
export function effectiveLimits(
  planId: string,
  status: string | null | undefined,
  isPlatformAdmin = false,
) {
  if (isPlatformAdmin) return planLimits("premium");
  if (!hasActiveSubscription(status)) {
    return {
      label: planLimits(planId).label,
      searches: 0,
      sites: 0,
      priceCents: 0,
    };
  }
  return planLimits(planId);
}

/** Human-friendly subscription state for the UI. */
export function subscriptionLabel(
  status: string | null | undefined,
  trialEnd: string | null | undefined,
): string {
  switch (status) {
    case "trialing":
      return trialEnd
        ? `Free trial — ends ${new Date(trialEnd).toLocaleDateString()}`
        : "Free trial";
    case "active":
      return "Active";
    case "past_due":
      return "Payment past due";
    case "canceled":
      return "Canceled";
    default:
      return "No active plan";
  }
}
