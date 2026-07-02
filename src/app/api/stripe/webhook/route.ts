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
