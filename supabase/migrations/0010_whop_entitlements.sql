-- =============================================================================
-- 0010 — Whop entitlements bridge (2026-08-28).
--
-- Whop sells the membership; this table carries that sale into a Sitagio account.
-- Keyed by EMAIL because a Whop buyer normally has no Sitagio account yet, so both
-- orderings work:
--   buy -> sign up : handle_new_user() claims the entitlement at account creation
--   sign up -> buy : the webhook finds the existing profile and upgrades it now
-- =============================================================================

create table if not exists public.whop_entitlements (
  email              text primary key,
  plan_id            text not null references public.plans(id),
  active             boolean not null default true,
  whop_user_id       text,
  whop_membership_id text,
  whop_plan_id       text,
  claimed_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists whop_entitlements_membership_idx
  on public.whop_entitlements(whop_membership_id);

-- Service-role only: written by the webhook, never read by an end user.
alter table public.whop_entitlements enable row level security;

-- ---------------------------------------------------------------------------
-- Claim a Whop entitlement at signup. Extends the 0005 trigger; profile/tenant/
-- membership creation and the referral capture below are unchanged.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tenant_id uuid;
  v_name      text;
  v_plan      text := 'free';
  v_claimed   boolean := false;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  v_name := coalesce(
    nullif(new.raw_user_meta_data->>'company_name', ''),
    split_part(coalesce(new.email, 'user'), '@', 1) || '''s workspace'
  );

  -- A Whop buyer creating their account now starts on the plan they already paid for.
  select plan_id into v_plan
    from public.whop_entitlements
   where email = lower(new.email) and active
   limit 1;
  if found then
    v_claimed := true;
  else
    v_plan := 'free';
  end if;

  insert into public.tenants (name, created_by, plan_id, referred_by_code)
  values (
    v_name,
    new.id,
    v_plan,
    nullif(lower(coalesce(new.raw_user_meta_data->>'ref_code', '')), '')
  )
  returning id into v_tenant_id;

  insert into public.memberships (tenant_id, user_id, role)
  values (v_tenant_id, new.id, 'owner');

  update public.profiles set current_tenant_id = v_tenant_id where id = new.id;

  if v_claimed then
    update public.whop_entitlements
       set claimed_by = new.id, updated_at = now()
     where email = lower(new.email);
  end if;

  return new;
end;
$$;
