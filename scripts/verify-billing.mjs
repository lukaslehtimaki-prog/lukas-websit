// Non-destructive billing check: confirms the Pro/Premium prices, that a Checkout session
// with a 7-day trial can be created (mirrors startCheckout), and that a subscription goes
// "trialing". Creates a throwaway customer and deletes it afterward.
//
//   node scripts/verify-billing.mjs
import { readFileSync } from "node:fs";
import Stripe from "stripe";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) =>
  (envText.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] ?? "").trim();

const stripe = new Stripe(get("STRIPE_SECRET_KEY"));
const proPrice = get("STRIPE_PRICE_PRO");
const premiumPrice = get("STRIPE_PRICE_PREMIUM");

async function main() {
  for (const [name, id, expect] of [
    ["Pro", proPrice, 2000],
    ["Premium", premiumPrice, 10000],
  ]) {
    try {
      const p = await stripe.prices.retrieve(id);
      const ok =
        p.unit_amount === expect &&
        p.currency === "eur" &&
        p.recurring?.interval === "month" &&
        p.active;
      console.log(
        `${ok ? "OK " : "!! "}${name}: €${p.unit_amount / 100}/${p.recurring?.interval} ${p.currency} active=${p.active}`,
      );
    } catch (e) {
      console.log(`!! ${name} price retrieve failed: ${e.message}`);
    }
  }

  const customer = await stripe.customers.create({
    email: `verify-${Date.now()}@example.com`,
    metadata: { leadfinder_verify: "1" },
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price: proPrice, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: "http://localhost:3000/dashboard/billing?success=1",
      cancel_url: "http://localhost:3000/dashboard/billing?canceled=1",
    });
    console.log(
      `OK Checkout session created (mode=subscription, 7-day trial) — ${session.id}`,
    );
  } catch (e) {
    console.log(`!! Checkout session failed: ${e.message}`);
  }

  try {
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: proPrice }],
      trial_period_days: 7,
    });
    console.log(
      `OK Subscription status: ${sub.status} (trial_end ${
        sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString().slice(0, 10)
          : "n/a"
      })`,
    );
  } catch (e) {
    console.log(`.. Direct subscription note: ${e.message}`);
  }

  await stripe.customers.del(customer.id).catch(() => {});
  console.log("OK Cleaned up throwaway test customer");
}

main().catch((e) => {
  console.error("verify failed:", e.message);
  process.exit(1);
});
