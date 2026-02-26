-- ============================================================
-- DutyProof Admin & Test Account Setup
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- STEP 1: Add new columns to existing database
-- (safe to run even if already added)
alter table public.profiles
  add column if not exists email text,
  add column if not exists is_admin boolean default false not null;

-- STEP 2: Install the auto-profile trigger
-- (creates a profiles row automatically whenever someone signs up)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- STEP 3: Backfill emails for any users who signed up before this trigger existed
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- STEP 4: Grant admin access to your master account
-- Uses UPSERT so it works whether or not a profile row exists yet.
insert into public.profiles (id, email, is_admin)
select id, email, true
from auth.users
where email = 'jongurfinkel@gmail.com'
on conflict (id) do update set
  is_admin = true,
  email = excluded.email;

-- ============================================================
-- ADDING MORE ACCOUNTS
-- After creating a user in Auth → Users → Add User:
--
-- Option A — Admin (full access, no billing prompt):
-- ============================================================
-- insert into public.profiles (id, email, is_admin)
-- select id, email, true from auth.users
-- where email = 'person@example.com'
-- on conflict (id) do update set is_admin = true, email = excluded.email;

-- ============================================================
-- Option B — Normal tester (sees app as a paying trial user):
-- ============================================================
-- insert into public.profiles (id, email, subscription_status, trial_ends_at)
-- select id, email, 'trialing', '2026-12-31 23:59:59+00' from auth.users
-- where email = 'person@example.com'
-- on conflict (id) do update set
--   subscription_status = 'trialing',
--   trial_ends_at = '2026-12-31 23:59:59+00',
--   email = excluded.email;

-- ============================================================
-- ONGOING MANAGEMENT (no SQL needed after this):
-- Supabase Dashboard → Table Editor → profiles
-- Find the user row by their email column → toggle is_admin
-- ============================================================

-- Verify: see all accounts and their access level
select
  p.email,
  p.subscription_status,
  p.trial_ends_at,
  p.is_admin,
  p.created_at
from public.profiles p
order by p.created_at desc;
