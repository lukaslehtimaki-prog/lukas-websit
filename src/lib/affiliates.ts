import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Affiliate program plumbing. Affiliates live in the `affiliates` table
// (service-role only; managed from the platform admin page). Referred
// sign-ups carry tenants.referred_by_code and get 10% off at checkout.

export const AFFILIATE_COUPON_ID = "affiliate-10";
export const AFFILIATE_DISCOUNT_PCT = 10;

export type Affiliate = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  commission_bps: number;
  clicks: number;
  active: boolean;
  created_at: string;
};

/** The active affiliate behind a referral code, or null. */
export async function getActiveAffiliate(
  code: string | null | undefined,
): Promise<Affiliate | null> {
  const c = code?.trim().toLowerCase();
  if (!c) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("affiliates")
    .select("*")
    .eq("code", c)
    .eq("active", true)
    .maybeSingle();
  return (data as Affiliate | null) ?? null;
}

/** The referral code stored on a tenant at signup, or null. */
export async function tenantReferralCode(
  tenantId: string,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tenants")
    .select("referred_by_code")
    .eq("id", tenantId)
    .maybeSingle();
  return (data as { referred_by_code?: string | null } | null)
    ?.referred_by_code ?? null;
}

/**
 * The 10%-off coupon, created on first use so it exists in whichever Stripe
 * mode (test/live) the server is running against — no manual setup.
 */
export async function ensureAffiliateCoupon(stripe: Stripe): Promise<string> {
  try {
    await stripe.coupons.retrieve(AFFILIATE_COUPON_ID);
  } catch {
    await stripe.coupons
      .create({
        id: AFFILIATE_COUPON_ID,
        percent_off: AFFILIATE_DISCOUNT_PCT,
        duration: "forever",
        name: "Affiliate 10% off",
      })
      .catch(() => {}); // lost a creation race — the coupon exists now
  }
  return AFFILIATE_COUPON_ID;
}
