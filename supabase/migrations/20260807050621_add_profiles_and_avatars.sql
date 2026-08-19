-- Optional private profile details and profile photos for Hour Logger.

comment on column public.categories.goal_minutes is
  'Editable category goal stored in minutes and entered/displayed as exact hours plus minutes.';
comment on column public.experience_entries.minutes is
  'Exact duration stored in minutes and entered/displayed as hours plus minutes.';

create table public.profiles (
  user_id uuid primary key default auth.uid()
    references auth.users (id) on delete cascade,
  full_name text not null default '',
  username text unique,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_length
    check (char_length(btrim(full_name)) <= 120),
  constraint profiles_username_format
    check (
      username is null
      or username ~ '^[a-z0-9_]{3,30}$'
    ),
  constraint profiles_avatar_owned
    check (
      avatar_path is null
      or avatar_path = user_id::text || '/avatar'
    )
);

comment on table public.profiles is
  'Optional profile details visible only to the authenticated owner.';
comment on column public.profiles.avatar_path is
  'Private Storage object path. The path is restricted to <user_id>/avatar.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function kiara_private.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.profiles from public, anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_photos_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "profile_photos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and name = (select auth.uid()::text) || '/avatar'
);

create policy "profile_photos_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and name = (select auth.uid()::text) || '/avatar'
)
with check (
  bucket_id = 'profile-photos'
  and name = (select auth.uid()::text) || '/avatar'
);

create policy "profile_photos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and name = (select auth.uid()::text) || '/avatar'
);
