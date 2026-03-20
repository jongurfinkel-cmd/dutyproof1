-- ============================================================
-- DutyProof Migration v3: Check-In Notes
-- Run this in Supabase SQL Editor AFTER migration_v2.
-- Adds: notes field on check_ins, updated complete_checkin RPC
-- ============================================================

-- ── Add notes column to check_ins ─────────────────────────────
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS notes text;

-- ── Update complete_checkin RPC to accept notes ───────────────
CREATE OR REPLACE FUNCTION public.complete_checkin(
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
BEGIN
  UPDATE public.check_ins
  SET
    status = 'completed',
    completed_at = p_completed_at,
    server_received_at = p_server_received_at,
    latitude = p_latitude,
    longitude = p_longitude,
    gps_accuracy = p_gps_accuracy,
    notes = p_notes
  WHERE id = p_checkin_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Check-in % is not pending or does not exist', p_checkin_id;
  END IF;
END;
$$;
