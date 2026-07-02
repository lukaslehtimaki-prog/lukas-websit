-- =============================================================================
-- Lead Finder SaaS — Phase 1: schema, Row-Level Security, signup trigger, plan seeds
--
-- Apply in the Supabase SQL Editor (paste + run) or with `supabase db push`.
-- This is the CANONICAL database definition. Keep src/lib/db/schema.ts in sync with the
-- tables below.
-- =============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ─────────────────────────────── Tables ───────────────────────────────

create table if not exists public.plans (
  id                    text primary key,            -- 'free' | 'pro'
  name                  text not null,
  monthly_search_limit  integer not null,
  monthly_site_limit    integer not null,
  price_cents           integer not null default 0,
  created_at            timestamptz not null default now()
);

create table if not exists public.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan_id     text not null default 'free' references public.plans(id),
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.memberships (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'owner' check (role in ('owner','admin','member')),
  created_at  timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships(user_id);

create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  full_name          text,
  is_platform_admin  boolean not null default false,
  current_tenant_id  uuid references public.tenants(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.searches (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  created_by     uuid references auth.users(id) on delete set null,
  niche          text not null,
  location_label text,
  lat            double precision,
  lng            double precision,
  radius_m       integer default 5000,
  status         text not null default 'pending' check (status in ('pending','running','complete','error')),
  result_count   integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists searches_tenant_idx on public.searches(tenant_id);

create table if not exists public.leads (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null references public.tenants(id) on delete cascade,
  search_id                   uuid references public.searches(id) on delete set null,
  source                      text not null default 'google_places',
  place_id                    text,
  name                        text not null,
  address                     text,
  phone                       text,
  category                    text,
  website                     text,
  website_status              text not null default 'unknown' check (website_status in ('no_website','has_website','unknown')),
  lat                         double precision,
  lng                         double precision,
  business_id                 text,                  -- y-tunnus
  registry_status             text not null default 'unchecked' check (registry_status in ('matched','low_confidence','no_match','unchecked')),
  registry_name               text,
  registry_registration_date  date,
  registry_industry_code      text,
  email                       text,                  -- reserved for future enrichment
  enrichment_source           text,
  crm_status                  text not null default 'new' check (crm_status in ('new','contacted','interested','converted','rejected')),
  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (tenant_id, place_id)
);
create index if not exists leads_tenant_idx on public.leads(tenant_id);

create table if not exists public.sites (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  lead_id      uuid references public.leads(id) on delete set null,
  template_id  text not null default 'generic',
  title        text not null,
  status       text not null default 'draft' check (status in ('draft','generated','published')),
  content      jsonb,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists sites_tenant_idx on public.sites(tenant_id);

create table if not exists public.usage_events (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  kind        text not null check (kind in ('lead_search','site_generation')),
  quantity    integer not null default 1,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists usage_tenant_created_idx on public.usage_events(tenant_id, created_at);

-- ──────────── Helper functions (SECURITY DEFINER — avoid RLS recursion) ────────────

create or replace function public.is_tenant_member(p_tenant uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where tenant_id = p_tenant and user_id = auth.uid()
  );
$$;

create or replace function public.is_tenant_admin(p_tenant uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where tenant_id = p_tenant and user_id = auth.uid() and role in ('owner','admin')
  );
$$;

-- ─────────────────────────────── Enable RLS ───────────────────────────────

alter table public.plans         enable row level security;
alter table public.tenants       enable row level security;
alter table public.memberships   enable row level security;
alter table public.profiles      enable row level security;
alter table public.searches      enable row level security;
alter table public.leads         enable row level security;
alter table public.sites         enable row level security;
alter table public.usage_events  enable row level security;

-- plans: any authenticated user may read; no client writes.
drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select to authenticated using (true);

-- profiles: a user sees and edits only their own row.
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- tenants: visible to members; updatable by owners/admins.
drop policy if exists tenants_member_select on public.tenants;
create policy tenants_member_select on public.tenants for select to authenticated using (public.is_tenant_member(id));
drop policy if exists tenants_admin_update on public.tenants;
create policy tenants_admin_update on public.tenants for update to authenticated using (public.is_tenant_admin(id)) with check (public.is_tenant_admin(id));

-- memberships: visible to members of the tenant; manageable by owners/admins.
drop policy if exists memberships_member_select on public.memberships;
create policy memberships_member_select on public.memberships for select to authenticated using (public.is_tenant_member(tenant_id));
drop policy if exists memberships_admin_write on public.memberships;
create policy memberships_admin_write on public.memberships for all to authenticated using (public.is_tenant_admin(tenant_id)) with check (public.is_tenant_admin(tenant_id));

-- Tenant-scoped resource tables: full CRUD restricted to members of the row's tenant.
drop policy if exists searches_member_all on public.searches;
create policy searches_member_all on public.searches for all to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists leads_member_all on public.leads;
create policy leads_member_all on public.leads for all to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists sites_member_all on public.sites;
create policy sites_member_all on public.sites for all to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists usage_member_select on public.usage_events;
create policy usage_member_select on public.usage_events for select to authenticated using (public.is_tenant_member(tenant_id));
drop policy if exists usage_member_insert on public.usage_events;
create policy usage_member_insert on public.usage_events for insert to authenticated with check (public.is_tenant_member(tenant_id));

-- ──────────────── Auto-provision a tenant when a user signs up ────────────────

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

  insert into public.tenants (name, created_by, plan_id)
  values (v_name, new.id, 'free')
  returning id into v_tenant_id;

  insert into public.memberships (tenant_id, user_id, role)
  values (v_tenant_id, new.id, 'owner');

  update public.profiles set current_tenant_id = v_tenant_id where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────── Seed plans ───────────────────────────────

insert into public.plans (id, name, monthly_search_limit, monthly_site_limit, price_cents)
values
  ('free', 'Free', 25,   3,   0),
  ('pro',  'Pro',  1000, 100, 4900)
on conflict (id) do update set
  name                 = excluded.name,
  monthly_search_limit = excluded.monthly_search_limit,
  monthly_site_limit   = excluded.monthly_site_limit,
  price_cents          = excluded.price_cents;
