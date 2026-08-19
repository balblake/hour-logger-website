# Supabase database setup

This starter uses Supabase Auth for public email/password registration and three
application tables for each user's private data. The migration contains no seed
records and does not import the spreadsheet. Every saved record belongs to one
authenticated user.

## Schema

| Table | Purpose |
| --- | --- |
| `categories` | User-created log tabs, display color, sort order, and editable goal stored as `goal_minutes`. |
| `organizations` | Reusable organizations with saved `contact_reference`, `default_role`, and details. `category_id` is optional. |
| `experience_entries` | Spreadsheet-like session rows. Durations are stored as integer minutes and entered/displayed as exact hours plus minutes; `entry_date` is nullable for undated legacy records. |
| `profiles` | Optional private name, username, and profile-photo path for each authenticated user. |

Ownership is enforced twice:

1. Row Level Security only exposes rows where `auth.uid() = user_id`.
2. Composite foreign keys include `user_id`, so an experience entry cannot link
   to another user's category or organization even if a malicious client knows
   that record's UUID. The same protection applies when an organization is
   assigned to a category.

Deleting a category also deletes its experience rows, so the application should
require a clear confirmation before category deletion. Category-specific
organizations become general organizations when their category is deleted.
Deleting an organization leaves its historical experience rows intact and sets
`organization_id` to `NULL`; the snapshot fields keep the recorded name and
contact.

## Apply the migration

The migration is:

`supabase/migrations/20260806000100_hour_logger_initial_schema.sql`

Apply it to the intended Hour Logger Supabase project through the normal linked-project
migration workflow or paste it into that project's SQL Editor. Confirm the
project reference before applying it. Do not run it against a different
Supabase project.

The migration explicitly grants `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to
`authenticated`, where RLS restricts every request to the signed-in owner. It
revokes access from `anon`. The standard `service_role` keeps administrative
table privileges for trusted server-side maintenance, but the web app never
receives or uses that secret role. The browser uses only the project's URL and
publishable key.

## Authentication settings

In the Hour Logger project:

1. Open **Authentication → Sign In / Providers → Email**.
2. Enable email/password authentication.
3. Turn **Allow new users to sign up** on.
4. Keep anonymous sign-ins off. Anonymous Auth users receive the database
   `authenticated` role and are not part of this account model.
5. Require email confirmation before first sign-in for the public application.
6. Set the production Site URL and add the local and production auth callback
   URLs before testing confirmation or password recovery.
7. Configure custom SMTP before public launch. Supabase's built-in sender is
   best-effort and limited to two authentication emails per hour.

Public registration happens through Supabase Auth and does not require `anon`
access to the application tables.

## Application data rules

- The client may omit `user_id`; its default is `auth.uid()`. If it supplies
  `user_id`, it must use the current authenticated user's ID.
- Store all category goals and experience durations in whole minutes. Split
  them into exact hours and minutes for entry, editing, and display.
- Store profile photos in the private `profile-photos` bucket under
  `<user-id>/avatar`. Storage RLS permits each user to access only that path.
- Show an organization in a category tab when its `category_id` is `NULL` or
  equals the active category ID.
- When a user selects an organization, prefill the form from
  `contact_reference` and `default_role`.
- When saving an experience entry, copy the selected organization's current
  `name` to `organization_name_snapshot` and `contact_reference` to
  `contact_snapshot`. A user may then edit `role_activity` for that session
  without changing the organization's default.
- Do not rewrite old snapshots when an organization changes; they represent
  what was recorded for that session.
- An `entry_date` of `NULL` is valid. The interface should label it as undated
  rather than inventing a date.
- No browser or public runtime variable should contain a secret key or legacy
  `service_role` key.

## Verification SQL

Run these read-only checks in the Supabase SQL Editor after applying the
migration.

```sql
-- All three exposed tables must have RLS enabled.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('categories', 'organizations', 'experience_entries')
order by c.relname;
```

Expected: three rows, each with `rls_enabled = true`.

```sql
-- Each table must have SELECT, INSERT, UPDATE, and DELETE ownership policies.
select
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('categories', 'organizations', 'experience_entries')
order by tablename, cmd;
```

Expected: four policies per table, all targeting `{authenticated}`.

```sql
-- Anonymous users should have no privileges; authenticated and the
-- server-only administrative role should have the expected privileges.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('categories', 'organizations', 'experience_entries')
  and grantee in ('anon', 'authenticated', 'service_role')
order by grantee, table_name, privilege_type;
```

Expected: no `anon` rows. `authenticated` and `service_role` each have the four
listed privileges on every table. The browser still receives only the
publishable key, never the service-role key.

```sql
-- Confirm the ownership-bearing composite foreign keys.
select
  conrelid::regclass as source_table,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where contype = 'f'
  and conname in (
    'organizations_user_category_fk',
    'experience_entries_user_category_fk',
    'experience_entries_user_organization_fk'
  )
order by conname;
```

Expected: every definition starts with `FOREIGN KEY (user_id, ...)`.

```sql
-- The migration itself imports no data.
select
  (select count(*) from public.categories) as categories,
  (select count(*) from public.organizations) as organizations,
  (select count(*) from public.experience_entries) as experience_entries;
```

Expected immediately after migration: `0, 0, 0`.

### Two-user isolation test

Register two temporary accounts through the public signup flow, then copy their
UUIDs from **Authentication → Users**. In the following transaction, replace
`<USER_A_UUID>` and `<USER_B_UUID>` with those actual UUIDs. The transaction
rolls back all fixtures.

```sql
begin;

-- Create temporary fixtures as the SQL Editor owner.
insert into public.categories
  (id, user_id, name, color, goal_minutes, sort_order)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '<USER_A_UUID>', '__rls_a__', '#7c3aed', 6000, 0),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '<USER_B_UUID>', '__rls_b__', '#7c3aed', 6000, 0);

insert into public.organizations
  (id, user_id, category_id, name, contact_reference, default_role)
values
  (
    'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb',
    '<USER_B_UUID>',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '__rls_org_b__',
    'Private contact B',
    'Private role B'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '<USER_A_UUID>', true);

-- User A must see only User A's fixture.
do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count
  from public.categories;

  if visible_count <> 1 then
    raise exception 'RLS isolation failed: User A saw % categories', visible_count;
  end if;

  raise notice 'PASS: User A sees exactly one owned category';
end;
$$;

-- RLS must reject writing a row owned by User B.
do $$
begin
  begin
    insert into public.categories
      (user_id, name, color, goal_minutes)
    values
      ('<USER_B_UUID>', '__forbidden_owner__', '#7c3aed', 60);

    raise exception 'RLS ownership test failed: cross-owner insert succeeded';
  exception
    when insufficient_privilege then
      raise notice 'PASS: RLS rejected a cross-owner insert';
  end;
end;
$$;

-- The category composite FK must reject linking User A to User B's category.
do $$
begin
  begin
    insert into public.experience_entries
      (user_id, category_id, minutes)
    values
      ('<USER_A_UUID>', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 30);

    raise exception 'Category ownership test failed: cross-user link succeeded';
  exception
    when foreign_key_violation then
      raise notice 'PASS: category composite FK rejected a cross-user link';
  end;
end;
$$;

-- The organization composite FK must reject linking User A to User B's org.
do $$
begin
  begin
    insert into public.experience_entries
      (user_id, category_id, organization_id, minutes)
    values
      (
        '<USER_A_UUID>',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb',
        30
      );

    raise exception 'Organization ownership test failed: cross-user link succeeded';
  exception
    when foreign_key_violation then
      raise notice 'PASS: organization composite FK rejected a cross-user link';
  end;
end;
$$;

reset role;
rollback;
```

The final four notices should report `PASS`, and the rollback should leave no
test data behind.

## Current Supabase references

- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Securing the Data API with grants and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [Auth general configuration](https://supabase.com/docs/guides/auth/general-configuration)
- [2026 Data API exposure change](https://supabase.com/changelog?types=breaking-change)
