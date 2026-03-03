-- ============================================================
-- DutyProof Audit Migration
-- Paste this into Supabase SQL Editor to apply security fixes.
-- Safe to run multiple times (uses DROP IF EXISTS + CREATE OR REPLACE).
-- ============================================================

-- ── 1. Drop old RLS policies that need replacing ──────────────────────────────

-- Profiles
drop policy if exists "Service role can upsert profiles" on public.profiles;
drop policy if exists "Service role can update any profile" on public.profiles;

-- Facilities (add missing DELETE policy)
drop policy if exists "Users delete own facilities" on public.facilities;

-- Check-ins
drop policy if exists "Service role can insert check-ins" on public.check_ins;

-- Alerts
drop policy if exists "Service role can insert alerts" on public.alerts;
drop policy if exists "Service role can update alerts" on public.alerts;

-- Checklist completions (add missing owner SELECT)
drop policy if exists "Owner reads own checklist completions" on public.checklist_completions;

-- ── 2. Create fixed RLS policies ──────────────────────────────────────────────

-- Profiles: INSERT restricted to own ID (trigger also handles this)
create policy "Service role can upsert profiles"
  on public.profiles for insert with check (auth.uid() = id);

-- Profiles: UPDATE restricted to service_role (for Stripe webhooks, admin ops)
create policy "Service role can update any profile"
  on public.profiles for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Facilities: users can delete their own
create policy "Users delete own facilities"
  on public.facilities for delete using (auth.uid() = owner_id);

-- Check-ins: only service role can insert (blocks anon/authenticated)
create policy "Service role can insert check-ins"
  on public.check_ins for insert with check (auth.role() = 'service_role');

-- Alerts: only service role can insert/update
create policy "Service role can insert alerts"
  on public.alerts for insert with check (auth.role() = 'service_role');

create policy "Service role can update alerts"
  on public.alerts for update using (auth.role() = 'service_role');

-- Checklist completions: owners can read their own
create policy "Owner reads own checklist completions"
  on public.checklist_completions for select
  using (
    exists (
      select 1 from public.watches w
      where w.id = watch_id and w.owner_id = auth.uid()
    )
  );

-- ── 3. Make checklist-photos bucket private ───────────────────────────────────

update storage.buckets
set public = false
where id = 'checklist-photos';

-- ── 4. Add escalate_checkin() RPC function ────────────────────────────────────

create or replace function public.escalate_checkin(
  p_checkin_id uuid,
  p_escalation_sent_at timestamptz,
  p_ack_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.check_ins
  set
    escalation_sent_at = p_escalation_sent_at,
    ack_token = p_ack_token
  where id = p_checkin_id
    and status = 'missed'
    and escalation_sent_at is null;  -- write-once: cannot re-escalate

  if not found then
    raise exception 'Check-in % cannot be escalated (not missed or already escalated)', p_checkin_id;
  end if;
end;
$$;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Verify: SELECT policyname, tablename, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;
