-- 0012 — Rate limiting for the credential endpoints.
--
-- Server Action ids are discoverable in the client bundle, so signInAction,
-- signUpAction and requestPasswordResetAction are all directly POST-able. Until
-- now the only thing between an attacker and unlimited password guessing /
-- signup flooding / reset-email flooding was Supabase's platform-level GoTrue
-- limit. This adds an application-level sliding window that the app can key by
-- email AND by IP.
--
-- Counters only; no PII beyond a hashed-shaped key string the app supplies.
-- Written and read exclusively by the service role (src/lib/rate-limit.ts uses
-- createAdminClient), so RLS is on with no policy = deny-all for everyone else.

create table if not exists public.auth_rate_limits (
  key          text primary key,
  count        integer not null default 0,
  window_start timestamptz not null default now()
);

alter table public.auth_rate_limits enable row level security;
revoke all on public.auth_rate_limits from anon, authenticated;

create index if not exists auth_rate_limits_window_idx
  on public.auth_rate_limits(window_start);

/**
 * Records one hit against `p_key` and reports whether it is still under the
 * limit. The window restarts once p_window_seconds have elapsed since the
 * first hit of the current window.
 *
 * Returns true when the caller should be ALLOWED to proceed.
 */
create or replace function public.auth_rate_limit_hit(
  p_key            text,
  p_limit          integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.auth_rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when public.auth_rate_limits.window_start
               < now() - make_interval(secs => p_window_seconds)
          then 1
          else public.auth_rate_limits.count + 1
        end,
        window_start = case
          when public.auth_rate_limits.window_start
               < now() - make_interval(secs => p_window_seconds)
          then now()
          else public.auth_rate_limits.window_start
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Only the service role may call it: an anon caller could otherwise burn
-- another account's login budget by spamming the RPC with their email as key.
revoke execute on function public.auth_rate_limit_hit(text, integer, integer)
  from public, anon, authenticated;

/** Housekeeping: drop windows nothing will ever read again. */
create or replace function public.auth_rate_limits_prune()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.auth_rate_limits where window_start < now() - interval '1 day';
$$;

revoke execute on function public.auth_rate_limits_prune()
  from public, anon, authenticated;
