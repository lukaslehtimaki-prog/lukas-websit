import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  planForPriceId,
  mapStripeStatus,
  isStripeConfigured,
} from "@/lib/stripe";

/**
 * Pull the tenant's latest subscription from Stripe and write it to the DB. Used on the
 * checkout success redirect so billing status updates locally without a webhook tunnel.
 * The webhook remains the source of truth for ongoing changes in production.
 */
export async function syncTenantSubscription(tenantId: string): Promise<void> {
  if (!isStripeConfigured()) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("stripe_customer_id")
    .eq("id", tenantId)
    .maybeSingle();
  const customerId = (data as { stripe_customer_id?: string } | null)
    ?.stripe_customer_id;
  if (!customerId) return;

  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  const sub = subs.data[0];
  if (!sub) return;

  const s = sub as unknown as {
    current_period_end?: number;
    trial_end?: number | null;
  };
  const priceId = sub.items?.data?.[0]?.price?.id;
  const plan = planForPriceId(priceId) ?? "pro";
  const status = mapStripeStatus(sub.status);
  const grantsAccess = ["trialing", "active", "past_due"].includes(status);

  await supabase
    .from("tenants")
    .update({
      stripe_subscription_id: sub.id,
      subscription_status: status,
      plan_id: grantsAccess ? plan : "free",
      current_period_end: s.current_period_end
        ? new Date(s.current_period_end * 1000).toISOString()
        : null,
      trial_end: s.trial_end
        ? new Date(s.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);
}
