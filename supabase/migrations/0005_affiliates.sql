-- Affiliate program: affiliates share links like sitovai.com/?ref=CODE.
-- Sign-ups via a link are attributed on the tenant; referred workspaces get a
-- 10% discount at checkout and the affiliate earns a commission (tracked in
-- the platform admin view; payouts are manual).

create table if not exists public.affiliates (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique check (code ~ '^[a-z0-9-]{3,32}$'),
  name           text not null,
  email          text,
  commission_bps integer not null default 2000, -- 20% of referred revenue
  clicks         integer not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Only the service role touches this table (admin UI + public click counter).
alter table public.affiliates enable row level security;

-- An affiliate who is also a Sitovai customer: linking their workspace gives
-- them the partner discount on their own subscription.
alter table public.affiliates
  add column if not exists tenant_id uuid unique references public.tenants(id) on delete set null;

alter table public.tenants add column if not exists referred_by_code text;

-- Atomic click counter, called via RPC from the ?ref= handler.
create or replace function public.affiliate_click(p_code text)
returns void language sql security definer set search_path = public as $$
  update public.affiliates set clicks = clicks + 1 where code = p_code and active;
$$;

-- Recreate the signup trigger to also record the referral code passed in the
-- signup metadata (set from the sitovai_ref cookie).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tenant_id uuid;
  v_name      text;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  v_name := coalesce(
    nullif(new.raw_user_meta_data->>'company_name', ''),
    split_part(coalesce(new.email, 'user'), '@', 1) || '''s workspace'
  );

  insert into public.tenants (name, created_by, plan_id, referred_by_code)
  values (
    v_name,
    new.id,
    'free',
    nullif(lower(coalesce(new.raw_user_meta_data->>'ref_code', '')), '')
  )
  returning id into v_tenant_id;

  insert into public.memberships (tenant_id, user_id, role)
  values (v_tenant_id, new.id, 'owner');

  update public.profiles set current_tenant_id = v_tenant_id where id = new.id;

  return new;
end;
$$;
