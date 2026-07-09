import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Affiliate program plumbing. Affiliates live in the `affiliates` table
// (service-role only; managed from the platform admin page). Referred
// sign-ups carry tenants.referred_by_code and get 10% off at checkout.

export const AFFILIATE_COUPON_ID = "affiliate-10";
export const AFFILIATE_DISCOUNT_PCT = 10;
export const PARTNER_COUPON_ID = "affiliate-partner-20";
export const PARTNER_DISCOUNT_PCT = 20;

export type Affiliate = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  commission_bps: number;
  clicks: number;
  active: boolean;
  /** Their own Sitovai workspace, when linked — grants the partner discount. */
  tenant_id: string | null;
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

/** The active affiliate whose own workspace this is (partner discount), or null. */
export async function getAffiliateForTenant(
  tenantId: string,
): Promise<Affiliate | null> {
  if (!tenantId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("affiliates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .maybeSingle();
  return (data as Affiliate | null) ?? null;
}

/**
 * Coupons are created on first use so they exist in whichever Stripe mode
 * (test/live) the server is running against — no manual setup.
 */
async function ensureCoupon(
  stripe: Stripe,
  id: string,
  percentOff: number,
  name: string,
): Promise<string> {
  try {
    await stripe.coupons.retrieve(id);
  } catch {
    await stripe.coupons
      .create({ id, percent_off: percentOff, duration: "forever", name })
      .catch(() => {}); // lost a creation race — the coupon exists now
  }
  return id;
}

/** 10% off for customers referred through an affiliate link. */
export function ensureAffiliateCoupon(stripe: Stripe): Promise<string> {
  return ensureCoupon(
    stripe,
    AFFILIATE_COUPON_ID,
    AFFILIATE_DISCOUNT_PCT,
    "Affiliate 10% off",
  );
}

/** 20% off an affiliate's own subscription — the partner perk. */
export function ensurePartnerCoupon(stripe: Stripe): Promise<string> {
  return ensureCoupon(
    stripe,
    PARTNER_COUPON_ID,
    PARTNER_DISCOUNT_PCT,
    "Sitovai partner 20% off",
  );
}
