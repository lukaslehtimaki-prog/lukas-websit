-- Conversation log for the AI chatbot add-on. Rows are inserted by the public
-- chat endpoint via the service role; tenant members can read and delete
-- their own sites' conversations. Also used to rate-limit chat volume per
-- site (see /api/c/[siteId]).

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  session_id  text not null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_site_idx
  on public.chat_messages(site_id, created_at desc);
create index if not exists chat_messages_session_idx
  on public.chat_messages(session_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists chat_messages_member_select on public.chat_messages;
create policy chat_messages_member_select on public.chat_messages
  for select to authenticated using (public.is_tenant_member(tenant_id));

drop policy if exists chat_messages_member_delete on public.chat_messages;
create policy chat_messages_member_delete on public.chat_messages
  for delete to authenticated using (public.is_tenant_member(tenant_id));
