-- ============================================================
-- DutyProof Migration v4: Offline Reconciliation
-- Run this in Supabase SQL Editor AFTER migration_v3.
-- Adds: completed_offline flag, reconcile_offline_checkin RPC
-- ============================================================

-- ── Add completed_offline flag to check_ins ───────────────────
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS completed_offline boolean DEFAULT false;

-- ── RPC: Reconcile an offline check-in that was already marked missed ──
-- This allows a worker's offline check-in to override a missed status
-- when the device_time proves they checked in before the token expired.
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
  -- Fetch the token expiry to validate the offline check-in was within window
  SELECT token_expires_at INTO v_token_expires_at
  FROM public.check_ins
  WHERE id = p_checkin_id AND status = 'missed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Check-in % is not missed or does not exist', p_checkin_id;
  END IF;

  -- Only reconcile if the device_time was BEFORE the token expired
  -- (i.e. the worker actually checked in on time but was offline)
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

-- ── Update complete_checkin to set completed_offline flag ──────
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
