-- Keep the profile table reachable through the Data API with only the
-- operations Hour Logger needs. Supabase projects can inherit broader
-- default table privileges when a table is created.

revoke all on table public.profiles from authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
