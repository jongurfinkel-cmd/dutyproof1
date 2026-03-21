import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/tokens'
import { rateLimit } from '@/lib/rate-limit'
import { sendOnlineResolvedSMS } from '@/lib/sms'

interface SyncCheckIn {
  device_time: string
  scheduled_time: string
  latitude: number | null
  longitude: number | null
  gps_accuracy: number | null
  notes: string | null
}

/**
 * POST /api/checkin/sync
 * Batch sync check-ins from an offline session.
 * Auth is via session_token (the fire watch is not logged in).
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowSec: 60, prefix: 'checkin-sync' })
  if (limited) return limited

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { session_token, check_ins } = body

  if (!session_token || typeof session_token !== 'string' || !/^[0-9a-f]{64}$/.test(session_token)) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 400 })
  }

  if (!Array.isArray(check_ins) || check_ins.length === 0 || check_ins.length > 100) {
    return NextResponse.json({ error: 'check_ins must be an array of 1-100 items' }, { status: 400 })
  }

  const admin = createAdminClient()
  const serverTime = new Date()

  // Validate the session token belongs to an active (or recently completed) watch
  const { data: watch, error: watchError } = await admin
    .from('watches')
    .select('id, status, check_interval_min, assigned_name, start_time, planned_end_time, escalation_phone, secondary_escalation_phone, compliance_status, consecutive_misses, location, facilities(name)')
    .eq('session_token', session_token)
    .single()

  if (watchError || !watch) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 404 })
  }

  // Allow sync for active watches, or watches completed within the last hour (late sync)
  if (watch.status !== 'active') {
    const { data: endedWatch } = await admin
      .from('watches')
      .select('ended_at')
      .eq('id', watch.id)
      .single()
    const endedAt = endedWatch?.ended_at ? new Date(endedWatch.ended_at) : null
    const oneHourAgo = new Date(serverTime.getTime() - 60 * 60 * 1000)
    if (!endedAt || endedAt < oneHourAgo) {
      return NextResponse.json({ error: 'Watch is no longer active' }, { status: 410 })
    }
  }

  let created = 0
  let reconciled = 0
  let skipped = 0
  let failed = 0

  for (const ci of check_ins as SyncCheckIn[]) {
    try {
      // Validate required fields
      if (!ci.device_time || !ci.scheduled_time) {
        failed++
        continue
      }

      const deviceTime = new Date(ci.device_time)
      const scheduledTime = new Date(ci.scheduled_time)
      if (isNaN(deviceTime.getTime()) || isNaN(scheduledTime.getTime())) {
        failed++
        continue
      }

      // Validate GPS if provided
      if (ci.latitude != null && (typeof ci.latitude !== 'number' || ci.latitude < -90 || ci.latitude > 90)) {
        failed++
        continue
      }
      if (ci.longitude != null && (typeof ci.longitude !== 'number' || ci.longitude < -180 || ci.longitude > 180)) {
        failed++
        continue
      }

      // Look for an existing check-in row matching this watch + scheduled_time (within 2 min tolerance)
      const toleranceMs = 2 * 60 * 1000
      const minTime = new Date(scheduledTime.getTime() - toleranceMs).toISOString()
      const maxTime = new Date(scheduledTime.getTime() + toleranceMs).toISOString()

      const { data: existing } = await admin
        .from('check_ins')
        .select('id, status, token, scheduled_time, token_expires_at')
        .eq('watch_id', watch.id)
        .gte('scheduled_time', minTime)
        .lte('scheduled_time', maxTime)
        .limit(1)
        .single()

      if (existing) {
        // Validate deviceTime is within a reasonable window (scheduled_time - 5min to token_expires_at + 5min)
        const gracePeriodMs = 5 * 60 * 1000
        const existingScheduled = new Date(existing.scheduled_time)
        const existingExpires = new Date(existing.token_expires_at)
        const windowStart = new Date(existingScheduled.getTime() - gracePeriodMs)
        const windowEnd = new Date(existingExpires.getTime() + gracePeriodMs)

        if (deviceTime < windowStart || deviceTime > windowEnd) {
          failed++
          continue
        }

        if (existing.status === 'completed') {
          // Already completed — idempotent skip
          skipped++
          continue
        }

        if (existing.status === 'pending' || existing.status === 'missed') {
          // Complete this check-in
          const { error: updateErr } = await admin
            .from('check_ins')
            .update({
              status: 'completed',
              completed_at: deviceTime.toISOString(),
              server_received_at: serverTime.toISOString(),
              latitude: ci.latitude ?? null,
              longitude: ci.longitude ?? null,
              gps_accuracy: ci.gps_accuracy ?? null,
              notes: ci.notes ?? null,
              completed_offline: true,
            })
            .eq('id', existing.id)

          if (updateErr) {
            console.error('Failed to update check-in:', updateErr)
            failed++
          } else {
            reconciled++
          }
          continue
        }
      }

      // No matching row — validate deviceTime is within scheduledTime ± interval_minutes
      const intervalMs = watch.check_interval_min * 60 * 1000
      if (deviceTime < new Date(scheduledTime.getTime() - intervalMs) || deviceTime > new Date(scheduledTime.getTime() + intervalMs)) {
        failed++
        continue
      }

      // Create a new check-in record
      const newToken = generateToken()
      const expiresAt = new Date(scheduledTime.getTime() + watch.check_interval_min * 60 * 1000)

      const { error: insertErr } = await admin
        .from('check_ins')
        .insert({
          watch_id: watch.id,
          scheduled_time: scheduledTime.toISOString(),
          token: newToken,
          token_expires_at: expiresAt.toISOString(),
          assigned_name: watch.assigned_name,
          status: 'completed',
          completed_at: deviceTime.toISOString(),
          server_received_at: serverTime.toISOString(),
          latitude: ci.latitude ?? null,
          longitude: ci.longitude ?? null,
          gps_accuracy: ci.gps_accuracy ?? null,
          notes: ci.notes ?? null,
          completed_offline: true,
        })

      if (insertErr) {
        console.error('Failed to insert check-in:', insertErr)
        failed++
      } else {
        created++
      }
    } catch (err) {
      console.error('Sync check-in error:', err)
      failed++
    }
  }

  // Always update last_sync_at — proves the watcher is online regardless of check-in results
  const { error: syncTimeErr } = await admin
    .from('watches')
    .update({ last_sync_at: serverTime.toISOString() })
    .eq('id', watch.id)
  if (syncTimeErr) console.error('Failed to update last_sync_at:', syncTimeErr)

  // Reset consecutive_misses if we successfully synced any check-ins
  if (created + reconciled > 0) {
    const { error: resetErr } = await admin
      .from('watches')
      .update({ consecutive_misses: 0, compliance_status: 'clean', last_sync_at: serverTime.toISOString() })
      .eq('id', watch.id)
    if (resetErr) console.error('Failed to reset misses:', resetErr)

    // If the watch was in offline_suspected state, send "back online" resolution to supervisor
    if (watch.compliance_status === 'offline_suspected' && watch.escalation_phone) {
      const facility = watch.facilities as unknown as { name: string } | null
      const facilityName = facility?.name ?? 'Unknown Facility'
      const displayName = watch.location ? `${facilityName} — ${watch.location}` : facilityName
      const totalSynced = created + reconciled
      // All synced check-ins were completed, but some may have been reconciled from "missed" — count those as late
      const onTime = created + reconciled - failed
      const late = reconciled // reconciled means they were marked missed but completed offline

      try {
        const resolvedSid = await sendOnlineResolvedSMS(
          watch.escalation_phone,
          watch.assigned_name,
          displayName,
          totalSynced,
          onTime > 0 ? onTime : totalSynced,
          late
        )

        await admin.from('alerts').insert({
          watch_id: watch.id,
          alert_type: 'watcher_online',
          recipient_phone: watch.escalation_phone,
          recipient_name: 'Supervisor',
          message: `${watch.assigned_name} is back online at ${displayName}. ${totalSynced} check-ins synced.`,
          delivery_status: resolvedSid ? 'sent' : 'failed',
          twilio_sid: resolvedSid,
        })

        // Also notify secondary if they were alerted
        if (watch.secondary_escalation_phone) {
          const secSid = await sendOnlineResolvedSMS(
            watch.secondary_escalation_phone,
            watch.assigned_name,
            displayName,
            totalSynced,
            onTime > 0 ? onTime : totalSynced,
            late
          )
          await admin.from('alerts').insert({
            watch_id: watch.id,
            alert_type: 'watcher_online',
            recipient_phone: watch.secondary_escalation_phone,
            recipient_name: 'Backup Supervisor',
            message: `${watch.assigned_name} is back online at ${displayName}. ${totalSynced} check-ins synced.`,
            delivery_status: secSid ? 'sent' : 'failed',
            twilio_sid: secSid,
          })
        }
      } catch (err) {
        console.error('Failed to send online resolution SMS:', err)
      }
    }
  }

  return NextResponse.json({
    created,
    reconciled,
    skipped,
    failed,
    serverTime: serverTime.toISOString(),
    watchStatus: watch.status,
  })
}
