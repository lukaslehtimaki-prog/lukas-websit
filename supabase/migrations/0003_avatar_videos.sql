-- =============================================================================
-- 0003 — Avatar Videos: AI spokesperson video generator (products, series, videos),
-- plan video limits, 'avatar_video' usage kind, private storage bucket.
-- Apply AFTER 0002_billing.sql (Supabase SQL Editor, or `supabase db push`).
-- =============================================================================

-- ─────────────────────── Plan limits: monthly video quota ───────────────────────

alter table public.plans
  add column if not exists monthly_video_limit integer not null default 0;

insert into public.plans (id, name, monthly_search_limit, monthly_site_limit, monthly_video_limit, price_cents)
values
  ('free',    'Free',    0,    0,   0,   0),
  ('pro',     'Pro',     500,  50,  15,  2000),
  ('premium', 'Premium', 5000, 500, 100, 10000)
on conflict (id) do update set
  name                 = excluded.name,
  monthly_search_limit = excluded.monthly_search_limit,
  monthly_site_limit   = excluded.monthly_site_limit,
  monthly_video_limit  = excluded.monthly_video_limit,
  price_cents          = excluded.price_cents;

-- ──────────────── usage_events: allow the 'avatar_video' kind ────────────────

alter table public.usage_events drop constraint if exists usage_events_kind_check;
alter table public.usage_events
  add constraint usage_events_kind_check
  check (kind in ('lead_search','site_generation','avatar_video'));

-- ─────────────────────────────── Tables ───────────────────────────────

create table if not exists public.avatar_products (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  created_by      uuid references auth.users(id) on delete set null,
  name            text not null,
  description     text not null default '',
  selling_points  jsonb not null default '[]',
  image_url       text,
  tone            text not null default 'casual',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists avatar_products_tenant_idx on public.avatar_products(tenant_id);

create table if not exists public.video_series (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  product_id  uuid not null references public.avatar_products(id) on delete cascade,
  created_by  uuid references auth.users(id) on delete set null,
  avatar_key  text not null,
  tone        text not null default 'casual',
  count       integer not null default 1 check (count between 1 and 5),
  status      text not null default 'draft' check (status in ('draft','rendering','complete','failed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists video_series_tenant_idx  on public.video_series(tenant_id);
create index if not exists video_series_product_idx on public.video_series(product_id);

create table if not exists public.videos (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  series_id         uuid not null references public.video_series(id) on delete cascade,
  hook_label        text not null default '',
  script            text not null,
  provider          text not null default 'heygen',
  provider_job_id   text,
  status            text not null default 'draft' check (status in ('draft','queued','rendering','ready','failed')),
  video_url         text,
  storage_path      text,
  duration_seconds  integer,
  cost_cents        integer,
  error             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists videos_tenant_idx       on public.videos(tenant_id);
create index if not exists videos_series_idx       on public.videos(series_id);
create index if not exists videos_provider_job_idx on public.videos(provider_job_id);

-- ─────────────────────────────── RLS ───────────────────────────────

alter table public.avatar_products enable row level security;
alter table public.video_series    enable row level security;
alter table public.videos          enable row level security;

drop policy if exists avatar_products_member_all on public.avatar_products;
create policy avatar_products_member_all on public.avatar_products for all to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists video_series_member_all on public.video_series;
create policy video_series_member_all on public.video_series for all to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists videos_member_all on public.videos;
create policy videos_member_all on public.videos for all to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

-- ──────────────── Storage: private bucket for rendered MP4s ────────────────
-- Accessed only via the service-role client (uploads + signed URLs); no
-- storage.objects policies means no anon/authenticated access.

insert into storage.buckets (id, name, public)
values ('avatar-videos', 'avatar-videos', false)
on conflict (id) do nothing;
