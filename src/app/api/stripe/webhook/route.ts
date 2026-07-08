import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, planForPriceId, mapStripeStatus } from "@/lib/stripe";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Stripe not configured", { status: 500 });
  }

  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new NextResponse("Webhook signature verification failed", {
      status: 400,
    });
  }

  const supabase = createAdminClient();

  async function syncSubscription(sub: Stripe.Subscription) {
    const s = sub as unknown as {
      current_period_end?: number;
      trial_end?: number | null;
    };
    const priceId = sub.items?.data?.[0]?.price?.id;
    const plan = planForPriceId(priceId) ?? "pro";
    const status = mapStripeStatus(sub.status);
    const grantsAccess = ["trialing", "active", "past_due"].includes(status);

    const update = {
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
    };

    const tenantId = sub.metadata?.tenant_id;
    if (tenantId) {
      await supabase.from("tenants").update(update).eq("id", tenantId);
    } else if (typeof sub.customer === "string") {
      await supabase
        .from("tenants")
        .update(update)
        .eq("stripe_customer_id", sub.customer);
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(sub);
        } else if (session.mode === "payment") {
          // A business may have bought its website through a pitch-email
          // payment link. Metadata is copied from the link to the session;
          // fall back to the link itself if it ever isn't.
          let meta = session.metadata ?? {};
          if (!meta.site_id && typeof session.payment_link === "string") {
            const pl = await stripe.paymentLinks.retrieve(session.payment_link);
            meta = pl.metadata ?? {};
          }
          if (meta.kind !== "site_sale" || !meta.site_id) break;
          const siteId = meta.site_id;
          const { data: site } = await supabase
            .from("sites")
            .select("content")
            .eq("id", siteId)
            .maybeSingle();
          const content = (site as { content?: Record<string, unknown> } | null)
            ?.content;
          if (content && typeof content === "object") {
            const payment =
              (content.payment as Record<string, unknown> | undefined) ?? {};
            await supabase
              .from("sites")
              .update({
                content: {
                  ...content,
                  payment: { ...payment, paidAt: new Date().toISOString() },
                },
                updated_at: new Date().toISOString(),
              })
              .eq("id", siteId);
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Stripe webhook handler error:", e);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
