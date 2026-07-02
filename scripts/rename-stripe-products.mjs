// Renames the existing Stripe products to the Sitexa brand (Standard €20, Pro €100).
//   node scripts/rename-stripe-products.mjs
import { readFileSync } from "node:fs";
import Stripe from "stripe";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] ?? "").trim();
const stripe = new Stripe(get("STRIPE_SECRET_KEY"));

async function rename(priceId, name, description) {
  if (!priceId) return;
  const price = await stripe.prices.retrieve(priceId);
  const pid = typeof price.product === "string" ? price.product : price.product?.id;
  if (!pid) return;
  const p = await stripe.products.update(pid, { name, description });
  console.log("Updated:", p.name);
}

await rename(
  get("STRIPE_PRICE_PRO"),
  "Sitexa Standard",
  "50 lead searches + 15 AI websites / month",
);
await rename(
  get("STRIPE_PRICE_PREMIUM"),
  "Sitexa Pro",
  "5,000 lead searches + 500 AI websites / month",
);
