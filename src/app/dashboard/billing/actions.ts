"use server";

import { headers } from "next/headers";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { getStripe, priceIdForPlan, isStripeConfigured } from "@/lib/stripe";
import { TRIAL_DAYS, type PlanId } from "@/lib/plans";
import {
  getActiveAffiliate,
  tenantReferralCode,
  ensureAffiliateCoupon,
} from "@/lib/affiliates";

type ActionResult = { url?: string; error?: string };

async function origin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host") ?? "localhost:3000"}`;
}

async function ensureCustomer(
  tenantId: string,
  email: string | null,
  name: string,
): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("stripe_customer_id")
    .eq("id", tenantId)
    .maybeSingle();
  const existing = (data as { stripe_customer_id?: string } | null)
    ?.stripe_customer_id;
  if (existing) return existing;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name,
    metadata: { tenant_id: tenantId },
  });
  await supabase
    .from("tenants")
    .update({ stripe_customer_id: customer.id })
    .eq("id", tenantId);
  return customer.id;
}

export async function startCheckout(plan: PlanId): Promise<ActionResult> {
  const ctx = await requireTenantContext();
  if (!isStripeConfigured())
    return { error: "Billing isn't set up yet (Stripe keys missing)." };
  if (ctx.role !== "owner" && ctx.role !== "admin")
    return { error: "Only workspace owners can manage billing." };

  const priceId = priceIdForPlan(plan);
  if (!priceId)
    return { error: `No Stripe price configured for the ${plan} plan.` };

  try {
    const customerId = await ensureCustomer(
      ctx.tenantId,
      ctx.email,
      ctx.tenantName || "Sitovai workspace",
    );
    const stripe = getStripe();
    const base = await origin();

    // Referred workspaces get the affiliate discount automatically. Stripe
    // forbids combining `discounts` with `allow_promotion_codes`, so referred
    // checkouts lose the manual promo-code field (they already have the deal).
    const affiliate = await getActiveAffiliate(
      await tenantReferralCode(ctx.tenantId),
    );
    const discounts = affiliate
      ? [{ coupon: await ensureAffiliateCoupon(stripe) }]
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          tenant_id: ctx.tenantId,
          ...(affiliate ? { affiliate_code: affiliate.code } : {}),
        },
      },
      metadata: {
        tenant_id: ctx.tenantId,
        plan,
        ...(affiliate ? { affiliate_code: affiliate.code } : {}),
      },
      success_url: `${base}/dashboard/billing?success=1`,
      cancel_url: `${base}/dashboard/billing?canceled=1`,
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      // Stripe Tax: calculates VAT once a tax registration exists (none yet — the
      // account isn't registered, so this correctly charges €0 until it is).
      // billing_address_collection + customer_update are required by Stripe when
      // automatic tax is on and the Customer doesn't already have a stored address.
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      tax_id_collection: { enabled: true },
    });
    return session.url ? { url: session.url } : { error: "Could not start checkout." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Checkout failed." };
  }
}

export async function openBillingPortal(): Promise<ActionResult> {
  const ctx = await requireTenantContext();
  if (!isStripeConfigured()) return { error: "Billing isn't set up yet." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("stripe_customer_id")
    .eq("id", ctx.tenantId)
    .maybeSingle();
  const customerId = (data as { stripe_customer_id?: string } | null)
    ?.stripe_customer_id;
  if (!customerId)
    return { error: "No billing account yet — start a plan first." };

  try {
    const stripe = getStripe();
    const base = await origin();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/dashboard/billing`,
    });
    return { url: portal.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not open billing portal." };
  }
}
