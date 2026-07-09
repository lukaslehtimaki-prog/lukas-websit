-- Finer-grained website detection: a Facebook/Instagram-only presence or a
-- dead/unreachable site are both sales opportunities, not "has a website".
alter table public.leads drop constraint if exists leads_website_status_check;
alter table public.leads add constraint leads_website_status_check
  check (website_status in ('no_website', 'social_only', 'dead_site', 'has_website', 'unknown'));
