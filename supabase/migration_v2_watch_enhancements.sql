-- ============================================================
-- DutyProof Migration v2: Watch Enhancements
-- Run this in Supabase SQL Editor AFTER the initial schema.sql.
-- Adds: watch_type, permit photo, post-work enforcement,
--        closeout evidence, secondary escalation, compliance status
-- ============================================================

-- ── New columns on watches ─────────────────────────────────────

-- Watch type: 'hot_work' or 'impairment'
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS watch_type text DEFAULT 'hot_work' NOT NULL;

-- Add check constraint for watch_type
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

-- Work stopped timestamp (set when hot work ends, starts post-work timer)
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS work_stopped_at timestamptz;

-- Secondary escalation contact
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS secondary_escalation_phone text;

-- Compliance status: computed flag for compliance gaps
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS compliance_status text DEFAULT 'clean';

DO $$ BEGIN
  ALTER TABLE public.watches
    ADD CONSTRAINT compliance_status_enum CHECK (compliance_status IN ('clean', 'gap_detected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Consecutive missed check-in counter (reset on each completed check-in)
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS consecutive_misses int DEFAULT 0;

-- ── Closeout evidence ──────────────────────────────────────────

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS closeout_notes text,
  ADD COLUMN IF NOT EXISTS closeout_photo_urls text[];  -- array of signed URLs

-- For impairment watches: restoration details
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS system_restored boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS restoration_verified_by text,
  ADD COLUMN IF NOT EXISTS restoration_verified_at timestamptz;

-- ── Storage bucket for watch evidence (permit photos, closeout photos) ──

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'watch-evidence',
  'watch-evidence',
  false,
  10485760,  -- 10 MB
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

-- ── Indexes ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_watches_watch_type ON public.watches(watch_type);
CREATE INDEX IF NOT EXISTS idx_watches_compliance_status ON public.watches(compliance_status);
