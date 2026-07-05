import "server-only";
import Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";
import type { PlanId } from "@/lib/plans";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error(
      "Stripe is not configured (STRIPE_SECRET_KEY). See README → Billing.",
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      appInfo: { name: "Sitovai" },
    });
  }
  return _stripe;
}

/** Stripe Price ID for a paid plan (from env, created by scripts/setup-stripe.mjs). */
export function priceIdForPlan(plan: PlanId): string {
  return plan === "premium" ? env.STRIPE_PRICE_PREMIUM : env.STRIPE_PRICE_PRO;
}

/** Reverse-map a Stripe Price ID back to our plan id. */
export function planForPriceId(
  priceId: string | null | undefined,
): PlanId | null {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PRICE_PREMIUM) return "premium";
  if (priceId === env.STRIPE_PRICE_PRO) return "pro";
  return null;
}

/** Map any Stripe subscription status to our allowed DB set (see the check constraint). */
export function mapStripeStatus(status: string): string {
  if (
    ["trialing", "active", "past_due", "canceled", "incomplete"].includes(status)
  ) {
    return status;
  }
  if (status === "unpaid") return "past_due";
  return "canceled";
}

export { isStripeConfigured };
