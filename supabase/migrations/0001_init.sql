-- MomentDrop — initial schema
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Security model:
--   * Hosts (logged-in users) can only see and change their own events/uploads (RLS).
--   * Guests never talk to the database directly: guest uploads are inserted by
--     our server code with the secret key, which bypasses RLS.
--   * "Automatically expose new tables" is off, so we grant table access explicitly.

-- ─── profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

-- Create a profile row automatically for every new user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users who signed up before this migration.
insert into public.profiles (id, name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

-- ─── events ──────────────────────────────────────────────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  title text not null check (char_length(title) between 1 and 120),
  event_type text not null default 'wedding'
    check (event_type in ('wedding', 'christening', 'birthday', 'other')),
  event_date date,
  welcome_message text check (char_length(welcome_message) <= 1000),
  logo_url text,
  cover_url text,
  primary_color text not null default '#bdff3c' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  uploads_open boolean not null default true,
  upload_deadline timestamptz,
  pin_hash text,
  guests_can_view boolean not null default false,
  created_at timestamptz not null default now()
);

create index events_owner_id_idx on public.events (owner_id);

-- ─── uploads ─────────────────────────────────────────────────────────────────
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  guest_name text not null check (char_length(guest_name) between 1 and 80),
  r2_key text not null unique,
  file_type text not null check (file_type in ('image', 'video')),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  width integer,
  height integer,
  duration_seconds numeric(6, 2),
  created_at timestamptz not null default now()
);

create index uploads_event_id_created_at_idx on public.uploads (event_id, created_at desc);

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.uploads enable row level security;

-- profiles: you can read and edit only your own profile
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- events: full access to your own events only
create policy "events: read own" on public.events
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "events: insert own" on public.events
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "events: update own" on public.events
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "events: delete own" on public.events
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- uploads: hosts can view and delete uploads of their own events.
-- No insert policy on purpose — guests upload through server code only.
create policy "uploads: read own events" on public.uploads
  for select to authenticated using (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  );
create policy "uploads: delete own events" on public.uploads
  for delete to authenticated using (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  );

-- ─── Grants (tables are not auto-exposed to the Data API) ───────────────────
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, delete on public.uploads to authenticated;
grant all on public.profiles, public.events, public.uploads to service_role;

-- Make the Data API see the new tables right away.
notify pgrst, 'reload schema';
