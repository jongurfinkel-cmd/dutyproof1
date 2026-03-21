-- ============================================================
-- DutyProof Migration v6: Persistent Session Token
-- Run this in Supabase SQL Editor AFTER all previous migrations.
-- Adds a stable session_token to watches so the check-in link
-- is permanent for the life of the watch (enables full offline).
-- ============================================================

-- ── Persistent session token on watches ──────────────────────
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS session_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_watches_session_token
  ON public.watches(session_token);

-- ── Add server_received_at to check_ins if not present ───────
-- (may already exist from migration_v4, safe to repeat)
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS server_received_at timestamptz;

-- ── Track last sync time for offline detection ────────────────
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;
