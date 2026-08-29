-- 0011 — Column-level write privileges for the `authenticated` role.
--
-- WHY THIS EXISTS
-- RLS policies on public.profiles (profiles_self_update) and public.tenants
-- (tenants_admin_update) only constrain WHICH ROW may be written, never WHICH
-- COLUMNS. Supabase's default grants give the `authenticated` role UPDATE on
-- every column of every table in public, so a signed-in user could bypass every
-- server action and PATCH PostgREST directly with their own anon key + JWT:
--
--   PATCH /rest/v1/profiles?id=eq.<own-uid>  {"is_platform_admin": true}
--     -> full platform-admin access, service-role-backed cross-tenant reads.
--   PATCH /rest/v1/tenants?id=eq.<own-tenant> {"plan_id":"premium", ...}
--     -> a paid plan without a cent reaching Stripe.
--
-- Row policies stay in place as the second layer; this migration adds the
-- missing first layer. Everything the app legitimately writes as the user is
-- kept (profiles.full_name, tenants.name/updated_at — see
-- src/app/dashboard/settings/actions.ts). Every other column on these two
-- tables is now service-role-only: the Stripe webhook, the Whop webhook,
-- billing-sync and the Connect helpers all already run through
-- createAdminClient() (src/lib/supabase/admin.ts), which uses the service_role
-- key and is exempt from both RLS and these grants.

-- ─────────────────────────── profiles ───────────────────────────
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ─────────────────────────── tenants ────────────────────────────
revoke update on public.tenants from anon, authenticated;
grant update (name, updated_at) on public.tenants to authenticated;

-- Neither table should ever be INSERTed or DELETEd by a normal user: rows are
-- created by handle_new_user() (SECURITY DEFINER) and never removed by the app.
revoke insert, delete on public.profiles from anon, authenticated;
revoke insert, delete on public.tenants from anon, authenticated;

-- ─────────────────────── usage metering ─────────────────────────
-- usage_member_insert lets any member insert usage rows, and quantity had no
-- CHECK — so a negative quantity dragged getMonthlyUsage() below zero and made
-- checkLimit()'s `used < limit` pass even on the free tier's limit of 0.
-- Clean up any existing non-positive rows first so the constraint can validate.
delete from public.usage_events where quantity is null or quantity <= 0;

alter table public.usage_events
  drop constraint if exists usage_events_quantity_positive;
alter table public.usage_events
  add constraint usage_events_quantity_positive check (quantity > 0);

-- Usage rows are an audit trail: members may append, never rewrite or erase.
revoke update, delete on public.usage_events from anon, authenticated;
