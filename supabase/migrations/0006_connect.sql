-- Stripe Connect payouts for website sales: users connect their own Stripe
-- (Express) account; sale payments route to them minus the platform fee.
alter table public.tenants
  add column if not exists stripe_connect_account_id text;
alter table public.tenants
  add column if not exists stripe_connect_ready boolean not null default false;
