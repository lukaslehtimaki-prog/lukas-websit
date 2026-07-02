// Creates (idempotently) the Nettisi Pro (€20/mo) and Premium (€100/mo) products +
// prices in your Stripe account, then writes the price IDs into .env.local.
//
// Run from the project root:  node scripts/setup-stripe.mjs
import { readFileSync, writeFileSync } from "node:fs";
import Stripe from "stripe";

const envUrl = new URL("../.env.local", import.meta.url);
let envText = readFileSync(envUrl, "utf8");

const get = (k) =>
  (envText.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] ?? "").trim();

const key = get("STRIPE_SECRET_KEY");
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set in .env.local — add it first.");
  process.exit(1);
}
if (!key.startsWith("sk_")) {
  console.error("STRIPE_SECRET_KEY does not look like a Stripe secret key (sk_...).");
  process.exit(1);
}

const stripe = new Stripe(key);

async function ensurePrice(slug, name, description, amountCents) {
  const lookupKey = `leadfinder_${slug}_monthly`;
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;

  const product = await stripe.products.create({
    name: `Nettisi ${name}`,
    description,
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: amountCents,
    recurring: { interval: "month" },
    lookup_key: lookupKey,
  });
  return price.id;
}

const proId = await ensurePrice(
  "pro",
  "Pro",
  "500 lead searches + 50 AI websites / month",
  2000,
);
const premiumId = await ensurePrice(
  "premium",
  "Premium",
  "5,000 lead searches + 500 AI websites / month",
  10000,
);

function setEnv(k, v) {
  const re = new RegExp(`^${k}=.*$`, "m");
  if (re.test(envText)) envText = envText.replace(re, `${k}=${v}`);
  else envText += `\n${k}=${v}`;
}
setEnv("STRIPE_PRICE_PRO", proId);
setEnv("STRIPE_PRICE_PREMIUM", premiumId);
writeFileSync(envUrl, envText);

console.log("Stripe products/prices ready and written to .env.local:");
console.log("  STRIPE_PRICE_PRO     =", proId);
console.log("  STRIPE_PRICE_PREMIUM =", premiumId);
console.log("\nRestart the dev server to pick up the new values.");
