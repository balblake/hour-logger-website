-- Remove whole-table privileges that bypass row-level security and make
-- future Data API exposure explicit.

revoke all privileges on table
  public.categories,
  public.organizations,
  public.experience_entries,
  public.profiles
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.categories,
  public.organizations,
  public.experience_entries,
  public.profiles
to authenticated;

alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;
