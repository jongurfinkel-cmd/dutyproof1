-- ============================================================
-- DutyProof — Safety Checklist Migration
-- Run this in the Supabase SQL Editor (project dashboard > SQL Editor)
-- ============================================================

-- 1. Checklist items configured by admin when creating a watch
create table if not exists watch_checklist_items (
  id           uuid        default gen_random_uuid() primary key,
  created_at   timestamptz default now(),
  watch_id     uuid        references watches(id) on delete cascade not null,
  label        text        not null,
  requires_photo boolean   default false,
  sort_order   int         default 0
);

-- 2. One immutable row per checklist item the worker completes
create table if not exists checklist_completions (
  id               uuid        default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  watch_id         uuid        references watches(id) on delete cascade not null,
  item_id          uuid        references watch_checklist_items(id) not null,
  completed_at     timestamptz default now(),
  photo_url        text,
  checklist_token  text        not null
);

-- 3. Add checklist columns to watches
alter table watches
  add column if not exists checklist_token         text,
  add column if not exists checklist_completed_at  timestamptz;

-- 4. Indexes
create index if not exists idx_watch_checklist_items_watch_id on watch_checklist_items(watch_id);
create index if not exists idx_checklist_completions_watch_id on checklist_completions(watch_id);
create index if not exists idx_watches_checklist_token        on watches(checklist_token);

-- 5. Row-Level Security
alter table watch_checklist_items  enable row level security;
alter table checklist_completions  enable row level security;

-- Owners can read their own checklist items from the dashboard
create policy "Owner reads own checklist items"
  on watch_checklist_items for select
  using (
    exists (
      select 1 from watches w
      where w.id = watch_id and w.owner_id = auth.uid()
    )
  );

-- Service role manages everything (API routes use service role key)
create policy "Service role full access to checklist items"
  on watch_checklist_items for all
  using (auth.role() = 'service_role');

create policy "Service role full access to completions"
  on checklist_completions for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 6. Storage bucket — created directly in SQL
-- ============================================================
-- Creates the bucket with:
--   • Private (not public) — files are never directly accessible via URL
--   • 10 MB file size limit (10,485,760 bytes)
--   • Allowed MIME types: JPEG, PNG, WebP, HEIC/HEIF only
--
-- NOTE: The service_role key used in API routes bypasses bucket-level
-- policies, so the primary enforcement layer is the server-side
-- validation in /api/checklist/upload/route.ts. The bucket restrictions
-- here act as a second line of defence for any direct uploads.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'checklist-photos',
  'checklist-photos',
  false,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: only the service role can read/write objects
-- (workers upload via the API route which uses service_role key)
create policy "Service role manages checklist photos"
  on storage.objects for all
  using (
    bucket_id = 'checklist-photos'
    and auth.role() = 'service_role'
  )
  with check (
    bucket_id = 'checklist-photos'
    and auth.role() = 'service_role'
  );
