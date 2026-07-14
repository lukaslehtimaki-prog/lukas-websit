-- Postgres grants EXECUTE on new functions to PUBLIC by default, which lets
-- anyone holding the public anon key call affiliate_click through PostgREST
-- and inflate click counters. Restrict it to the service role (the proxy's
-- background call), which is the only intended caller.
revoke execute on function public.affiliate_click(text) from public;
revoke execute on function public.affiliate_click(text) from anon;
revoke execute on function public.affiliate_click(text) from authenticated;
grant execute on function public.affiliate_click(text) to service_role;
