// End-to-end billing test against the owner's real workspace: creates the Stripe customer,
// starts a 7-day Pro trial, and syncs it to the DB exactly like the app's checkout flow.
// Test mode only — cancelable from the billing portal. Run:  node scripts/provision-trial.mjs
import { readFileSync } from "node:fs";
import Stripe from "stripe";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) =>
  (envText.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] ?? "").trim();

const SUPA = get("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
const SVC = get("SUPABASE_SERVICE_ROLE_KEY");
const PRO_PRICE = get("STRIPE_PRICE_PRO");
const ADMIN_EMAIL = (get("PLATFORM_ADMIN_EMAILS").split(",")[0] || "").trim();
const stripe = new Stripe(get("STRIPE_SECRET_KEY"));

const H = {
  apikey: SVC,
  Authorization: `Bearer ${SVC}`,
  "Content-Type": "application/json",
};
async function rest(path, opts = {}) {
  const r = await fetch(`${SUPA}/rest/v1/${path}`, {
    ...opts,
    headers: { ...H, ...(opts.headers || {}) },
  });
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// 1) locate the owner's workspace
const profs = await rest(
  `profiles?email=eq.${encodeURIComponent(ADMIN_EMAIL)}&select=id`,
);
const userId = profs?.[0]?.id;
if (!userId) {
  console.error("No profile for", ADMIN_EMAIL);
  process.exit(1);
}
const mems = await rest(`memberships?user_id=eq.${userId}&select=tenant_id`);
const tenantId = mems?.[0]?.tenant_id;
const tenant = (
  await rest(`tenants?id=eq.${tenantId}&select=id,name,stripe_customer_id`)
)?.[0];
console.log("Workspace:", tenant.name, `(${tenant.id})`);

// 2) ensure a Stripe customer (mirrors startCheckout -> ensureCustomer)
let customerId = tenant.stripe_customer_id;
if (!customerId) {
  const c = await stripe.customers.create({
    email: ADMIN_EMAIL,
    name: tenant.name,
    metadata: { tenant_id: tenantId },
  });
  customerId = c.id;
  await rest(`tenants?id=eq.${tenantId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ stripe_customer_id: customerId }),
  });
  console.log("Stripe customer created:", customerId);
} else {
  console.log("Stripe customer (existing):", customerId);
}

// 3) start the 7-day Pro trial (what completing checkout produces)
const sub = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: PRO_PRICE }],
  trial_period_days: 7,
  metadata: { tenant_id: tenantId },
});
const periodEnd =
  sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
console.log("Subscription:", sub.id, "status:", sub.status);

// 4) sync to DB (mirrors syncTenantSubscription / the webhook)
await rest(`tenants?id=eq.${tenantId}`, {
  method: "PATCH",
  headers: { Prefer: "return=minimal" },
  body: JSON.stringify({
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    plan_id: "pro",
    trial_end: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }),
});

// 5) verify what the app will now read
const after = (
  await rest(
    `tenants?id=eq.${tenantId}&select=subscription_status,plan_id,trial_end`,
  )
)?.[0];
console.log("\n=== RESULT (what the dashboard now shows) ===");
console.log(JSON.stringify(after, null, 2));
