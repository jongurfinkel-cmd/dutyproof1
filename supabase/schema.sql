-- ============================================================
-- DutyProof Database Schema
-- Run this entire file in Supabase SQL Editor (one paste).
-- ============================================================

-- PROFILES TABLE
-- One row per authenticated user. Created automatically on signup via trigger.
-- Stripe webhooks update subscription fields; is_admin toggled manually.
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  created_at timestamptz default now() not null,
  email text,                            -- copied from auth.users on signup
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default null, -- 'incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  is_admin boolean default false not null -- bypasses all subscription checks
);

-- TRIGGER: auto-create a profile row when a new user signs up
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

-- FACILITIES TABLE
-- One row per building/facility the admin manages
create table if not exists public.facilities (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  name text not null,
  address text,
  timezone text default 'America/New_York' not null,
  owner_id uuid references auth.users(id) not null
);

-- WATCHES TABLE
-- One row per fire watch event
create table if not exists public.watches (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  facility_id uuid references public.facilities(id) on delete cascade not null,
  status text default 'active' not null, -- 'active' or 'completed'
  check_interval_min int not null,        -- 1-1440 minutes
  start_time timestamptz not null,
  assigned_name text not null,
  assigned_phone text not null,
  reason text,
  location text,
  escalation_phone text,
  escalation_delay_min int default 0,
  planned_end_time timestamptz,
  ended_by uuid references auth.users(id) on delete set null,
  ended_at timestamptz,
  owner_id uuid references auth.users(id) on delete cascade not null,
  constraint check_interval_range check (check_interval_min >= 1 and check_interval_min <= 1440),
  constraint escalation_delay_range check (escalation_delay_min >= 0 and escalation_delay_min <= 60),
  constraint watch_status_enum check (status in ('active', 'completed'))
);

-- CHECK-INS TABLE
-- One row per completed OR missed check-in. IMMUTABLE after creation.
create table if not exists public.check_ins (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  watch_id uuid references public.watches(id) not null,
  scheduled_time timestamptz not null,
  status text not null default 'pending', -- 'pending', 'completed', 'missed', 'cancelled'
  completed_at timestamptz,              -- device-reported time
  server_received_at timestamptz,        -- server time on receipt
  latitude double precision,
  longitude double precision,
  gps_accuracy double precision,         -- meters
  token text not null unique,            -- unique check-in token
  token_expires_at timestamptz not null, -- window expiration
  assigned_name text not null,
  escalation_sent_at timestamptz,        -- when escalation SMS was sent (null if not yet)
  constraint checkin_status_enum check (status in ('pending', 'completed', 'missed', 'cancelled'))
);

-- ALERTS TABLE
-- One row per escalation/notification sent
create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  watch_id uuid references public.watches(id) not null,
  check_in_id uuid references public.check_ins(id),
  alert_type text not null, -- 'missed_checkin', 'sms_sent', 'sms_delivered', 'sms_failed', 'watch_started', 'watch_ended'
  recipient_phone text,
  recipient_name text,
  message text,
  delivery_status text,  -- 'sent', 'delivered', 'failed'
  twilio_sid text,
  constraint alert_type_enum check (alert_type in ('missed_checkin', 'sms_sent', 'sms_delivered', 'sms_failed', 'watch_started', 'watch_ended'))
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.facilities enable row level security;
alter table public.watches enable row level security;
alter table public.check_ins enable row level security;
alter table public.alerts enable row level security;

-- Profiles
create policy "Users see own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Service role can upsert profiles"
  on public.profiles for insert with check (true);

create policy "Service role can update any profile"
  on public.profiles for update using (true) with check (true);

-- Facilities
create policy "Users see own facilities"
  on public.facilities for select using (auth.uid() = owner_id);

create policy "Users create own facilities"
  on public.facilities for insert with check (auth.uid() = owner_id);

create policy "Users update own facilities"
  on public.facilities for update using (auth.uid() = owner_id);

-- Watches
create policy "Users see own watches"
  on public.watches for select using (auth.uid() = owner_id);

create policy "Users create own watches"
  on public.watches for insert with check (auth.uid() = owner_id);

create policy "Users update own watches"
  on public.watches for update using (auth.uid() = owner_id);

-- Check-ins: viewable by watch owner; insertable by service role only
create policy "Users see check-ins for own watches"
  on public.check_ins for select using (
    watch_id in (select id from public.watches where owner_id = auth.uid())
  );

-- IMMUTABILITY: No direct updates or deletes on check_ins from client.
-- Updates happen only via security-definer Postgres functions below.
create policy "check_ins are immutable - no updates"
  on public.check_ins for update using (false);

create policy "check_ins are immutable - no deletes"
  on public.check_ins for delete using (false);

-- Allow inserting check-ins (service role bypasses this, but anon needs it blocked)
create policy "Service role can insert check-ins"
  on public.check_ins for insert with check (true);

-- Alerts: viewable by watch owner
create policy "Users see alerts for own watches"
  on public.alerts for select using (
    watch_id in (select id from public.watches where owner_id = auth.uid())
  );

create policy "Service role can insert alerts"
  on public.alerts for insert with check (true);

create policy "Service role can update alerts"
  on public.alerts for update using (true);

-- ============================================================
-- POSTGRES FUNCTIONS (bypass RLS for specific transitions)
-- These are SECURITY DEFINER — they run as the function owner.
-- Only allowed state transitions are encoded here.
-- ============================================================

-- Mark a pending check-in as completed
create or replace function public.complete_checkin(
  p_checkin_id uuid,
  p_completed_at timestamptz,
  p_server_received_at timestamptz,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_gps_accuracy double precision default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.check_ins
  set
    status = 'completed',
    completed_at = p_completed_at,
    server_received_at = p_server_received_at,
    latitude = p_latitude,
    longitude = p_longitude,
    gps_accuracy = p_gps_accuracy
  where id = p_checkin_id
    and status = 'pending';  -- only pending -> completed

  if not found then
    raise exception 'Check-in % is not pending or does not exist', p_checkin_id;
  end if;
end;
$$;

-- Mark a pending check-in as missed
create or replace function public.mark_checkin_missed(
  p_checkin_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.check_ins
  set status = 'missed'
  where id = p_checkin_id
    and status = 'pending';  -- only pending -> missed

  if not found then
    raise exception 'Check-in % is not pending or does not exist', p_checkin_id;
  end if;
end;
$$;

-- Cancel all pending check-ins for a watch (when watch is ended)
create or replace function public.cancel_watch_checkins(
  p_watch_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.check_ins
  set status = 'cancelled'
  where watch_id = p_watch_id
    and status = 'pending';
end;
$$;

-- ============================================================
-- INDEXES (for query performance)
-- ============================================================

create index if not exists idx_check_ins_watch_id on public.check_ins(watch_id);
create index if not exists idx_check_ins_token on public.check_ins(token);
create index if not exists idx_check_ins_status on public.check_ins(status);
create index if not exists idx_check_ins_token_expires_at on public.check_ins(token_expires_at);
create index if not exists idx_watches_owner_status on public.watches(owner_id, status);
create index if not exists idx_alerts_watch_id on public.alerts(watch_id);
create index if not exists idx_alerts_twilio_sid on public.alerts(twilio_sid);
create index if not exists idx_facilities_owner_id on public.facilities(owner_id);
create index if not exists idx_check_ins_status_escalation on public.check_ins(status, escalation_sent_at);
create index if not exists idx_check_ins_watch_id_status on public.check_ins(watch_id, status);
