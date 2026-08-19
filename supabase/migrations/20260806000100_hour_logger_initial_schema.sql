-- Hour Logger database: initial private, per-user data model.
-- Authentication users are managed by Supabase Auth. This migration intentionally
-- creates no users, categories, organizations, or experience data.

create schema if not exists kiara_private;

revoke all on schema kiara_private
  from public, anon, authenticated, service_role;

create function kiara_private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke all on function kiara_private.set_updated_at()
  from public, anon, authenticated, service_role;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  name text not null,
  color text not null,
  goal_minutes integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_user_id_id_key unique (user_id, id),
  constraint categories_name_not_blank
    check (char_length(btrim(name)) between 1 and 120),
  constraint categories_color_not_blank
    check (char_length(btrim(color)) between 1 and 32),
  constraint categories_goal_minutes_nonnegative
    check (goal_minutes >= 0),
  constraint categories_sort_order_nonnegative
    check (sort_order >= 0)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  category_id uuid,
  name text not null,
  contact_reference text not null default '',
  default_role text not null default '',
  details text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organizations_user_id_id_key unique (user_id, id),
  constraint organizations_name_not_blank
    check (char_length(btrim(name)) between 1 and 200),
  constraint organizations_user_category_fk
    foreign key (user_id, category_id)
    references public.categories (user_id, id)
    on update restrict
    on delete set null (category_id)
);

create table public.experience_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  category_id uuid not null,
  organization_id uuid,
  entry_date date,
  session_notes text not null default '',
  organization_name_snapshot text not null default '',
  role_activity text not null default '',
  minutes integer not null,
  contact_snapshot text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint experience_entries_minutes_positive
    check (minutes > 0),
  constraint experience_entries_user_category_fk
    foreign key (user_id, category_id)
    references public.categories (user_id, id)
    on update restrict
    on delete cascade,
  constraint experience_entries_user_organization_fk
    foreign key (user_id, organization_id)
    references public.organizations (user_id, id)
    on update restrict
    on delete set null (organization_id)
);

comment on column public.categories.goal_minutes is
  'Editable category goal stored in minutes. Convert to hours only for display.';
comment on column public.organizations.category_id is
  'Optional category assignment. NULL makes the organization available to every category owned by the same user.';
comment on column public.experience_entries.entry_date is
  'Nullable so undated legacy spreadsheet entries can be preserved.';
comment on column public.experience_entries.organization_name_snapshot is
  'Organization name copied when the entry is saved so history survives later organization edits or deletion.';
comment on column public.experience_entries.contact_snapshot is
  'Contact/reference copied when the entry is saved so history survives later organization edits or deletion.';

create index categories_user_sort_idx
  on public.categories (user_id, sort_order, created_at, id);

create index organizations_user_category_name_idx
  on public.organizations (user_id, category_id, name);

create index experience_entries_user_category_date_idx
  on public.experience_entries
    (user_id, category_id, entry_date desc nulls last, created_at desc);

create index experience_entries_user_organization_idx
  on public.experience_entries (user_id, organization_id)
  where organization_id is not null;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function kiara_private.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function kiara_private.set_updated_at();

create trigger experience_entries_set_updated_at
before update on public.experience_entries
for each row execute function kiara_private.set_updated_at();

alter table public.categories enable row level security;
alter table public.organizations enable row level security;
alter table public.experience_entries enable row level security;

create policy "categories_select_own"
on public.categories
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "categories_insert_own"
on public.categories
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "categories_update_own"
on public.categories
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "categories_delete_own"
on public.categories
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "organizations_select_own"
on public.organizations
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "organizations_insert_own"
on public.organizations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "organizations_update_own"
on public.organizations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "organizations_delete_own"
on public.organizations
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "experience_entries_select_own"
on public.experience_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "experience_entries_insert_own"
on public.experience_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "experience_entries_update_own"
on public.experience_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "experience_entries_delete_own"
on public.experience_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Make Data API exposure deterministic across old and new Supabase projects.
-- Only signed-in users receive table privileges; RLS still limits every row.
revoke all on table
  public.categories,
  public.organizations,
  public.experience_entries
from public, anon;

grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.categories,
  public.organizations,
  public.experience_entries
to authenticated;

-- Keep the standard server-only administrative role usable for maintenance.
-- The web application never receives or uses this secret role.
grant select, insert, update, delete on table
  public.categories,
  public.organizations,
  public.experience_entries
to service_role;
