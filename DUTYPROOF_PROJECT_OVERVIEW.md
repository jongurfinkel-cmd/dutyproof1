# DutyProof — Complete Project Overview

**Last updated:** March 20, 2026
**Status:** Build passes clean, ready for deployment
**Codebase:** ~21,000 lines of TypeScript/TSX

---

## What Is DutyProof?

DutyProof is a **fire watch compliance platform** that automates the verification and documentation of fire watch duties required by NFPA 51B and OSHA standards. It replaces paper logs with real-time digital check-ins, GPS-verified location tracking, automated escalation, and tamper-proof compliance reports.

**The problem it solves:** When hot work (welding, cutting, brazing) is performed, regulations require a trained fire watcher to remain on-site for the duration of work plus a post-work monitoring period. Paper-based verification is unreliable — fire watchers can sign logs after the fact, supervisors have no real-time visibility, and there's no proof the watcher was actually present. DutyProof makes every check-in GPS-verified, time-stamped, and immutable.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (serverless), Node.js runtime for PDF |
| Database | Supabase (PostgreSQL + RLS + RPC functions) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (`watch-evidence` bucket for photos) |
| SMS | Sinch (10DLC compliant) |
| Payments | Stripe (subscription billing) |
| PDF | @react-pdf/renderer (server-side generation) |
| Maps | OpenStreetMap tiles + Leaflet (interactive) |
| Hosting | Vercel |
| Offline | IndexedDB + Service Worker |

---

## Architecture Overview

### Dual-User Model

**Supervisor (authenticated, dashboard):**
- Creates and manages watches from the web dashboard
- Receives escalation alerts when check-ins are missed
- Acknowledges alerts with GPS verification
- Ends watches with closeout evidence
- Downloads immutable compliance reports

**Fire Watcher (unauthenticated, mobile):**
- Receives a single persistent link (session token) — no login required
- Checks in on a timed interval by tapping a button
- GPS location captured automatically with each check-in
- Works fully offline — check-ins queue in IndexedDB and sync when connectivity returns
- Completes pre-watch safety checklist before first check-in

### Key Architectural Decisions

1. **Persistent session tokens** — One URL per watch (not per check-in). The watcher keeps one link open for the entire watch duration. Old rotating-token system kept for backwards compatibility.

2. **Offline-first client** — The check-in page computes the schedule locally, captures GPS, and stores check-ins in IndexedDB. A background sync batches queued check-ins to the server. The watcher never needs to be online to check in.

3. **Immutable audit trail** — Check-in records in the database are protected by RLS policies that block UPDATE and DELETE. Modifications go through PostgreSQL RPC functions (`complete_checkin`, `mark_checkin_missed`, `cancel_watch_checkins`, `reconcile_offline_checkin`, `complete_late_checkin`) that enforce business rules.

4. **Server-side cron for missed check-in detection** — A Vercel cron job runs every minute, detects missed check-ins, distinguishes online vs. offline watchers, and triggers a multi-tier escalation ladder.

---

## Complete Watch Lifecycle

### Phase 1: Watch Creation
Supervisor fills out a multi-step form:
- **Step 1 — Location:** Select facility (job site), optional wing/area, watch type (hot work or impairment)
- **Step 2 — Worker:** Assign fire watcher by name, optional phone for SMS, optional GPS geofence
- **Step 3 — Schedule:** Set check-in interval (minutes), start time, planned end time, post-work monitoring duration, escalation contacts
- **Step 4 — Review:** Confirm all details, optional safety checklist with photo requirements

**API:** `POST /api/watches/start` — Creates watch record, generates session token, creates first check-in row, sends SMS if enabled, logs `watch_started` alert.

### Phase 2: Pre-Watch Safety Checklist (Optional)
If a checklist was configured, the watcher must complete it before check-ins begin:
- Each item can require a photo (e.g., fire extinguisher photo)
- Photos are uploaded to Supabase Storage with magic-byte validation
- Checklist can be overridden by supervisor if needed
- First check-in is scheduled one interval after start time to give time for checklist

**API:** `POST /api/checklist/complete`, `POST /api/checklist/upload`

### Phase 3: Active Check-Ins
The watcher's phone shows a countdown timer. When it's time:
1. Timer hits zero → "CHECK IN NOW" button appears
2. Watcher taps the button → GPS captured, check-in queued
3. If online: immediately sent to server via `POST /api/checkin`
4. If offline: stored in IndexedDB, batch-synced later via `POST /api/checkin/sync`
5. Next check-in scheduled automatically

**Grace period:** If a check-in is missed by the cron but the watcher is still on the page, they get a 5-minute grace window to submit a late check-in.

**Offline reconciliation:** If cron marks a check-in as "missed" while the watcher was offline, the batch sync endpoint reconciles it — changing status from "missed" back to "completed" with the original device timestamp.

### Phase 4: Missed Check-In Escalation
When a check-in is missed:

1. **Online watcher (last_sync_at within 5 minutes):**
   - Immediate or delayed escalation SMS to supervisor
   - Secondary escalation to backup supervisor after 3 minutes if unacknowledged

2. **Offline watcher (last_sync_at older than 5 minutes):**
   - "Watcher offline" alert sent to supervisor
   - When watcher comes back online and syncs, "back online" resolution sent
   - Consecutive misses tracked; compliance status updated

**Supervisor acknowledgment:** Supervisor receives SMS with a link. Tapping it captures their GPS location and timestamps the acknowledgment — proving they were aware and responsive.

### Phase 5: Stop Work
When hot work ends but the watch must continue:
1. Supervisor clicks "Stop Work" on dashboard
2. Post-work monitoring countdown begins (configurable, default 30 min)
3. Check-ins continue during cooldown
4. Watcher sees live countdown timer
5. Watch cannot be ended or handed off until cooldown completes
6. Cron respects cooldown — won't auto-end during active post-work period

### Phase 6: Handoff (Optional)
If the watcher needs to be replaced mid-watch:
1. Supervisor enters new watcher's name and phone
2. Old session token is revoked (old watcher's link dies immediately)
3. New session token generated
4. All pending check-ins cancelled, new one created for replacement
5. Handoff logged in audit trail with both names and reason

**API:** `POST /api/watches/handoff`

### Phase 7: Watch Closeout
When post-work monitoring is complete:
1. Supervisor opens closeout form
2. Optional: closeout notes, closeout photos (up to 10MB each, magic-byte validated)
3. For impairment watches: system restoration confirmation + verifier name
4. Supervisor clicks "Confirm End Watch"
5. Watch status set to `completed`, all pending check-ins cancelled
6. Summary SMS sent to watcher and supervisor with stats
7. `watch_ended` alert logged

**API:** `POST /api/watches/end`, `POST /api/watches/upload-closeout`

### Phase 8: Compliance Report
After the watch is completed, supervisor can download an immutable PDF compliance report containing:
- Job site information with timezone
- Complete watch summary (type, watcher, interval, permit, duration, closeout evidence)
- Compliance score (% rate, completed/missed counts, alerts sent, acknowledged)
- GPS coverage map (OpenStreetMap tiles centered on average check-in location)
- Supervisor acknowledgment map (if applicable)
- Full check-in timeline with device time, server time, GPS coordinates, accuracy, offline indicator, and notes
- Activity log (escalations, handoffs, offline events, acknowledgments)
- Pre-watch safety checklist with completion status and photo indicators
- Page numbers and fixed footer on every page

**API:** `GET /api/reports/[id]` (only available for completed watches)

---

## Pages & Routes

### Dashboard (Authenticated)

| Route | Description |
|-------|-------------|
| `/dashboard` | Active watches overview with urgency-based sorting |
| `/watches/new` | Multi-step watch creation wizard |
| `/watches/[id]` | Watch detail — live status, check-in timeline, QR code, closeout form, handoff, report download |
| `/history` | Completed watches with search, sort, pagination, CSV export |
| `/facilities` | Job site CRUD with timezone management |
| `/billing` | Stripe subscription management |

### Public (No Auth Required)

| Route | Description |
|-------|-------------|
| `/checkin/[token]` | Fire watcher check-in page (2,381 lines — the core of the product) |
| `/checklist/[token]` | Pre-watch safety checklist completion |
| `/ack/[token]` | Supervisor escalation acknowledgment with GPS |

### Auth

| Route | Description |
|-------|-------------|
| `/login` | Sign in with redirect support |
| `/signup` | Registration with work email |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset form |

### Marketing

| Route | Description |
|-------|-------------|
| `/` | Landing page with interactive demo |
| `/industries` | Industry-specific use cases |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/security` | Security overview |
| `/support` | Support contact form |
| `/support/walkthrough` | Guided walkthrough request |
| `/sms-consent` | SMS opt-in documentation |

---

## API Endpoints (25 total)

### Watch Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/watches/start` | Create new watch with session token |
| POST | `/api/watches/end` | End watch or stop work |
| POST | `/api/watches/handoff` | Reassign watcher mid-watch |
| POST | `/api/watches/delete` | Delete watch (only if no completed check-ins) |
| POST | `/api/watches/resend-sms` | Resend check-in link via SMS |
| POST | `/api/watches/upload-permit` | Upload permit photo |
| POST | `/api/watches/upload-closeout` | Upload closeout photo |

### Check-In System
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/checkin` | Submit individual check-in (online or offline sync) |
| GET | `/api/checkin/validate` | Validate token/session, return watch config |
| POST | `/api/checkin/sync` | Batch sync offline check-ins (up to 100) |
| POST | `/api/checkin/stop-work` | Watcher-initiated work stop notification |
| POST | `/api/checkin/simulate` | Dev-only: simulate a check-in |

### Checklist
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/checklist/validate` | Validate checklist token |
| POST | `/api/checklist/complete` | Mark checklist as completed |
| POST | `/api/checklist/upload` | Upload checklist item photo |

### Escalation
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ack/validate` | Validate acknowledgment token |
| POST | `/api/ack` | Submit supervisor acknowledgment with GPS |

### Infrastructure
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/cron/check-missed` | Cron: detect missed check-ins, escalate, auto-end |
| GET | `/api/reports/[id]` | Generate PDF compliance report |
| POST | `/api/stripe/create-checkout` | Start Stripe checkout session |
| POST | `/api/stripe/portal` | Open Stripe customer portal |
| POST | `/api/webhooks/stripe` | Handle Stripe subscription events |
| POST | `/api/webhooks/twilio` | Handle SMS delivery status callbacks |
| POST | `/api/contact/support` | Submit support request |
| POST | `/api/contact/walkthrough` | Request guided walkthrough |

---

## Database Schema

### Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User accounts | `subscription_status`, `is_admin` |
| `facilities` | Job sites | `name`, `address`, `timezone`, `owner_id` |
| `watches` | Active/completed watches | `status`, `session_token`, `assigned_name`, `assigned_phone`, `check_interval_min`, `escalation_phone`, `compliance_status`, `work_stopped_at`, `closeout_notes`, `closeout_photo_urls` |
| `check_ins` | Individual check-in records | `status`, `scheduled_time`, `completed_at`, `server_received_at`, `latitude`, `longitude`, `gps_accuracy`, `ack_at`, `ack_latitude`, `completed_offline`, `notes` |
| `alerts` | Audit trail of all events | `alert_type` (11 types), `message`, `delivery_status`, `twilio_sid` |
| `watch_checklist_items` | Checklist template items | `label`, `requires_photo`, `sort_order` |
| `checklist_completions` | Completed checklist items | `item_id`, `completed_at`, `photo_url` |

### Alert Types (11)
`missed_checkin`, `sms_sent`, `sms_delivered`, `sms_failed`, `watch_started`, `watch_ended`, `escalation_acknowledged`, `watcher_offline`, `watcher_online`, `offline_reconciled`, `late_recovery`

### RPC Functions (Immutability Layer)
- `complete_checkin()` — Mark pending check-in as completed
- `mark_checkin_missed()` — Mark expired check-in as missed
- `cancel_watch_checkins()` — Cancel all pending check-ins for a watch
- `reconcile_offline_checkin()` — Change missed → completed (offline sync)
- `complete_late_checkin()` — Complete within grace period after cron marked missed

### Migrations
1. `schema.sql` — Base schema (profiles, facilities, watches, check_ins, alerts, RLS policies)
2. `migration_v2_watch_enhancements.sql` — Session tokens, post-work fields, geofence, closeout evidence, compliance tracking
3. `migration_v3_alert_types.sql` — Expanded alert_type constraint for new event types

---

## Security & Compliance Features

### Data Protection
- **Row-Level Security (RLS):** Every table has RLS policies. Users can only access their own data.
- **Immutable records:** `check_ins` table blocks all UPDATE/DELETE at the RLS level. Changes go through audited RPC functions.
- **Token validation:** All tokens are 64-character hex (256-bit entropy), validated with regex before database queries.
- **Rate limiting:** Every endpoint has request-rate limits (configurable per route).
- **Input validation:** E.164 phone format, UUID format, coordinate ranges, file size limits, magic-byte verification for uploads.
- **CRON_SECRET:** Cron endpoint is protected by a secret environment variable.

### Upload Security
- Allowed types: JPEG, PNG, WebP, HEIC only
- Magic byte validation (not just MIME type checking)
- 10 MB file size limit
- Stored in Supabase Storage with signed URLs (1-year expiry)

### GPS Verification
- Continuous `watchPosition` tracking (not one-shot)
- Accuracy indicator: green (≤20m), amber (≤50m), red (>50m)
- GPS accuracy must be > 0 (zero/negative rejected)
- Coordinates validated: lat -90 to 90, lon -180 to 180
- Geofence enforcement: configurable radius (10-5000m)

### Offline Resilience
- IndexedDB stores queued check-ins with timestamps
- Batch sync endpoint processes up to 100 check-ins per request
- Device time validated against scheduled windows (prevents timestamp forgery)
- Server records both device time and server-received time for audit trail
- `last_sync_at` field tracks watcher connectivity (5-minute offline detection window)

---

## Key Files by Size

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/checkin/[token]/page.tsx` | 2,381 | Watcher check-in page (offline-first, GPS, timers) |
| `src/app/(dashboard)/watches/[id]/page.tsx` | 1,314 | Supervisor watch detail page |
| `src/lib/pdf.ts` | 718 | PDF compliance report generator |
| `src/app/api/cron/check-missed/route.ts` | 447 | Cron job: missed detection + escalation ladder |
| `src/app/api/watches/start/route.ts` | 359 | Watch creation with full validation |
| `src/app/api/checkin/route.ts` | 295 | Individual check-in submission + reconciliation |
| `src/app/api/checkin/sync/route.ts` | 278 | Batch offline sync |
| `src/app/api/watches/end/route.ts` | 217 | Watch closeout + summary SMS |
| `src/app/api/watches/handoff/route.ts` | 187 | Watcher reassignment |

---

## Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) |
| `NEXT_PUBLIC_APP_URL` | Application URL (for SMS links) |
| `SINCH_SERVICE_PLAN_ID` | Sinch SMS service plan |
| `SINCH_API_TOKEN` | Sinch SMS API token |
| `SINCH_FROM_NUMBER` | Sinch sender phone number |
| `SINCH_REGION` | Sinch API region |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_PRICE_ID` | Stripe subscription price |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `CRON_SECRET` | Secret for cron endpoint auth |

---

## Deployment Checklist

1. Run all three migrations in Supabase SQL Editor (in order)
2. Enable Email auth in Supabase Authentication > Providers
3. Create `watch-evidence` storage bucket in Supabase
4. Set all environment variables in Vercel
5. Configure Vercel cron: `GET /api/cron/check-missed` every minute
6. Configure Sinch webhook to point to `/api/webhooks/twilio`
7. Configure Stripe webhook to point to `/api/webhooks/stripe`
8. `npm run build` → deploy

---

*Built with Next.js 16, Supabase, Sinch, Stripe, and @react-pdf/renderer.*
*~21,000 lines of TypeScript across 25 API endpoints, 16 pages, and 3 database migrations.*
