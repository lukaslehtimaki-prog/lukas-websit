-- =============================================================================
-- 0002 — Billing: Stripe subscription fields on tenants + updated plan tiers.
-- Apply AFTER 0001_init.sql (Supabase SQL Editor, or `supabase db push`).
-- =============================================================================

alter table public.tenants
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status    text not null default 'none'
       check (subscription_status in ('none','trialing','active','past_due','canceled','incomplete')),
  add column if not exists current_period_end     timestamptz,
  add column if not exists trial_end              timestamptz;

create index if not exists tenants_stripe_customer_idx on public.tenants(stripe_customer_id);

-- New plan tiers + prices (price_cents in EUR cents: Pro €20, Premium €100).
-- Free = read-only (0 new searches / sites) until a plan is started.
insert into public.plans (id, name, monthly_search_limit, monthly_site_limit, price_cents)
values
  ('free',    'Free',    0,    0,    0),
  ('pro',     'Pro',     500,  50,   2000),
  ('premium', 'Premium', 5000, 500,  10000)
on conflict (id) do update set
  name                 = excluded.name,
  monthly_search_limit = excluded.monthly_search_limit,
  monthly_site_limit   = excluded.monthly_site_limit,
  price_cents          = excluded.price_cents;
