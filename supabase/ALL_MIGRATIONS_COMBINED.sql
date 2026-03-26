-- ============================================================
-- DutyProof: ALL MIGRATIONS (safe to re-run)
-- Paste this entire block into Supabase SQL Editor.
-- Run AFTER schema.sql.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- MIGRATION v2: Watch Enhancements
-- ════════════════════════════════════════════════════════════

-- Watch type: 'hot_work' or 'impairment'
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS watch_type text DEFAULT 'hot_work' NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.watches
    ADD CONSTRAINT watch_type_enum CHECK (watch_type IN ('hot_work', 'impairment'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Permit fields
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS permit_number text,
  ADD COLUMN IF NOT EXISTS permit_photo_url text;

-- Post-work monitoring enforcement (minutes)
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS post_work_duration_min int DEFAULT 30;

DO $$ BEGIN
  ALTER TABLE public.watches
    ADD CONSTRAINT post_work_duration_range CHECK (post_work_duration_min >= 0 AND post_work_duration_min <= 480);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Work stopped timestamp
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS work_stopped_at timestamptz;

-- Secondary escalation contact
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS secondary_escalation_phone text;

-- Compliance status
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS compliance_status text DEFAULT 'clean';

-- Drop old compliance constraint and add expanded one (includes 'offline_suspected')
ALTER TABLE public.watches DROP CONSTRAINT IF EXISTS compliance_status_enum;
ALTER TABLE public.watches ADD CONSTRAINT compliance_status_enum
  CHECK (compliance_status IN ('clean', 'gap_detected', 'offline_suspected'));

-- Consecutive missed check-in counter
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS consecutive_misses int DEFAULT 0;

-- Closeout evidence
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS closeout_notes text,
  ADD COLUMN IF NOT EXISTS closeout_photo_urls text[];

-- Impairment restoration details
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS system_restored boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS restoration_verified_by text,
  ADD COLUMN IF NOT EXISTS restoration_verified_at timestamptz;

-- Watch evidence storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'watch-evidence',
  'watch-evidence',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  CREATE POLICY "Service role manages watch evidence"
    ON storage.objects FOR ALL
    USING (
      bucket_id = 'watch-evidence'
      AND auth.role() = 'service_role'
    )
    WITH CHECK (
      bucket_id = 'watch-evidence'
      AND auth.role() = 'service_role'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Geofence location
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS watch_latitude double precision,
  ADD COLUMN IF NOT EXISTS watch_longitude double precision,
  ADD COLUMN IF NOT EXISTS watch_radius_m int DEFAULT 100;

CREATE INDEX IF NOT EXISTS idx_watches_watch_type ON public.watches(watch_type);
CREATE INDEX IF NOT EXISTS idx_watches_compliance_status ON public.watches(compliance_status);


-- ════════════════════════════════════════════════════════════
-- MIGRATION v3: Check-In Notes
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS notes text;


-- ════════════════════════════════════════════════════════════
-- MIGRATION v4: Offline Reconciliation
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS completed_offline boolean DEFAULT false;

-- RPC: Reconcile offline check-in (missed -> completed)
CREATE OR REPLACE FUNCTION public.reconcile_offline_checkin(
  p_checkin_id uuid,
  p_completed_at timestamptz,
  p_server_received_at timestamptz,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_gps_accuracy double precision DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_expires_at timestamptz;
BEGIN
  SELECT token_expires_at INTO v_token_expires_at
  FROM public.check_ins
  WHERE id = p_checkin_id AND status = 'missed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Check-in % is not missed or does not exist', p_checkin_id;
  END IF;

  IF p_completed_at > v_token_expires_at THEN
    RAISE EXCEPTION 'Device time % is after token expiry % — cannot reconcile', p_completed_at, v_token_expires_at;
  END IF;

  UPDATE public.check_ins
  SET
    status = 'completed',
    completed_at = p_completed_at,
    server_received_at = p_server_received_at,
    latitude = p_latitude,
    longitude = p_longitude,
    gps_accuracy = p_gps_accuracy,
    notes = p_notes,
    completed_offline = true
  WHERE id = p_checkin_id
    AND status = 'missed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to reconcile check-in %', p_checkin_id;
  END IF;
END;
$$;

-- Updated complete_checkin with offline flag
CREATE OR REPLACE FUNCTION public.complete_checkin(
  p_checkin_id uuid,
  p_completed_at timestamptz,
  p_server_received_at timestamptz,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_gps_accuracy double precision DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_completed_offline boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.check_ins
  SET
    status = 'completed',
    completed_at = p_completed_at,
    server_received_at = p_server_received_at,
    latitude = p_latitude,
    longitude = p_longitude,
    gps_accuracy = p_gps_accuracy,
    notes = p_notes,
    completed_offline = p_completed_offline
  WHERE id = p_checkin_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Check-in % is not pending or does not exist', p_checkin_id;
  END IF;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- MIGRATION v5: Late Check-In Grace Period
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION complete_late_checkin(
  p_checkin_id uuid,
  p_completed_at timestamptz,
  p_server_received_at timestamptz,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_gps_accuracy double precision DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_grace_period_min int DEFAULT 5
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_expires_at timestamptz;
BEGIN
  SELECT status, token_expires_at INTO v_status, v_expires_at
  FROM check_ins WHERE id = p_checkin_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Check-in not found';
  END IF;

  IF v_status = 'completed' THEN
    RAISE EXCEPTION 'Already completed';
  END IF;

  IF v_status != 'missed' THEN
    RAISE EXCEPTION 'Check-in is not in missed status';
  END IF;

  IF p_server_received_at > v_expires_at + (p_grace_period_min || ' minutes')::interval THEN
    RAISE EXCEPTION 'Grace period has expired';
  END IF;

  UPDATE check_ins SET
    status = 'completed',
    completed_at = p_completed_at,
    server_received_at = p_server_received_at,
    latitude = p_latitude,
    longitude = p_longitude,
    gps_accuracy = p_gps_accuracy,
    notes = p_notes,
    completed_offline = false
  WHERE id = p_checkin_id;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- MIGRATION v6: Persistent Session Token
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS session_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_watches_session_token
  ON public.watches(session_token);

ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS server_received_at timestamptz;

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;


-- ════════════════════════════════════════════════════════════
-- MIGRATION v7: Alert Types Expansion
-- ════════════════════════════════════════════════════════════

ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alert_type_enum;

ALTER TABLE alerts ADD CONSTRAINT alert_type_enum CHECK (
  alert_type IN (
    'missed_checkin',
    'sms_sent',
    'sms_delivered',
    'sms_failed',
    'watch_started',
    'watch_ended',
    'escalation_acknowledged',
    'watcher_offline',
    'watcher_online',
    'offline_reconciled',
    'late_recovery'
  )
);


-- ════════════════════════════════════════════════════════════
-- MIGRATION v8: Refund Eligibility Tracking
-- ════════════════════════════════════════════════════════════

-- Set once on first-ever checkout. Never overwritten on resubscription.
-- Ensures the 30-day money-back guarantee only applies to first-time subscribers.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_subscribed_at timestamptz;


-- ════════════════════════════════════════════════════════════
-- MIGRATION v9: SMS Double Opt-In
-- ════════════════════════════════════════════════════════════

-- Consent token sent in the first SMS to the watcher.
-- Watcher taps a link containing this token to confirm consent.
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS sms_consent_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS sms_consent_confirmed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_watches_sms_consent_token
  ON public.watches(sms_consent_token);


-- ════════════════════════════════════════════════════════════
-- MIGRATION v10: Performance Indexes
-- ════════════════════════════════════════════════════════════

-- Speed up Stripe webhook lookups by customer ID
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;


-- ════════════════════════════════════════════════════════════
-- DONE — All migrations applied.
-- ════════════════════════════════════════════════════════════
