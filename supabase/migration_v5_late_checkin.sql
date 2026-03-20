-- Migration v5: Allow late check-ins when cron marks missed before worker taps
-- This handles the race condition where the cron job runs and marks a check-in
-- as missed just seconds before the worker taps CHECK IN.

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

  -- Only allow if server time is within the grace period after token expiry
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
