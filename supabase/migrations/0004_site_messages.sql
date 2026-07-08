-- Message inbox for published sites: contact-form and booking-form submissions.
-- Rows are inserted by the public form endpoint via the service role; tenant
-- members can read and delete their own messages.

create table if not exists public.site_messages (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites(id) on delete cascade,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  kind           text not null default 'contact' check (kind in ('contact', 'booking')),
  name           text not null,
  email          text,
  phone          text,
  service        text,
  preferred_time text,
  message        text,
  forwarded      boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists site_messages_tenant_idx
  on public.site_messages(tenant_id, created_at desc);
create index if not exists site_messages_site_idx
  on public.site_messages(site_id);

alter table public.site_messages enable row level security;

drop policy if exists site_messages_member_select on public.site_messages;
create policy site_messages_member_select on public.site_messages
  for select to authenticated using (public.is_tenant_member(tenant_id));

drop policy if exists site_messages_member_delete on public.site_messages;
create policy site_messages_member_delete on public.site_messages
  for delete to authenticated using (public.is_tenant_member(tenant_id));
