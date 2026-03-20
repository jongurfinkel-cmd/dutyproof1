import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/tokens'
import { sendCheckInSMS } from '@/lib/sms'
import { addMinutes } from 'date-fns'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { limit: 20, windowSec: 60, prefix: 'checkin' })
    if (limited) return limited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { token, latitude, longitude, gps_accuracy, device_time, notes, completed_offline } = body

    if (!token || typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Validate GPS coordinates if provided
    if (latitude != null && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
    }
    if (longitude != null && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
    }
    if (gps_accuracy != null && (typeof gps_accuracy !== 'number' || gps_accuracy < 0)) {
      return NextResponse.json({ error: 'Invalid GPS accuracy' }, { status: 400 })
    }
    // Validate notes if provided
    if (notes != null && (typeof notes !== 'string' || notes.length > 1000)) {
      return NextResponse.json({ error: 'Notes must be 1–1000 characters' }, { status: 400 })
    }

    const admin = createAdminClient()
    const serverTime = new Date().toISOString()
    const isOfflineSync = !!completed_offline

    // Use device_time as completed_at if provided (offline queue), otherwise server time.
    const completedAt = (device_time && typeof device_time === 'string' && !isNaN(new Date(device_time).getTime()))
      ? new Date(device_time).toISOString()
      : serverTime

    // Find the check-in by token (look for any status — needed for reconciliation)
    const { data: checkIn, error: findError } = await admin
      .from('check_ins')
      .select('*, watches(*, facilities(*))')
      .eq('token', token)
      .single()

    if (findError || !checkIn) {
      return NextResponse.json({ error: 'Invalid or already used token' }, { status: 404 })
    }

    const watch = checkIn.watches
    if (!watch || !watch.facilities) {
      console.error('Check-in missing watch/facility join data:', checkIn.id)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // If already completed, reject
    if (checkIn.status === 'completed') {
      return NextResponse.json({ error: 'This check-in has already been recorded.' }, { status: 409 })
    }

    // If cancelled, reject
    if (checkIn.status === 'cancelled') {
      return NextResponse.json({ error: 'This watch has ended.' }, { status: 410 })
    }

    // Check watch is still active (but allow reconciliation even for ended watches)
    if (watch.status !== 'active' && checkIn.status === 'pending') {
      return NextResponse.json({ error: 'This watch has ended' }, { status: 410 })
    }

    let wasReconciled = false

    if (checkIn.status === 'pending') {
      // Normal flow: check expiration (skip for offline syncs — device_time is the truth)
      if (!isOfflineSync && new Date(serverTime) > new Date(checkIn.token_expires_at)) {
        return NextResponse.json({ error: 'This check-in window has expired' }, { status: 410 })
      }

      // Mark check-in as completed
      const { error: completeError } = await admin.rpc('complete_checkin', {
        p_checkin_id: checkIn.id,
        p_completed_at: completedAt,
        p_server_received_at: serverTime,
        p_latitude: latitude ?? null,
        p_longitude: longitude ?? null,
        p_gps_accuracy: gps_accuracy ?? null,
        p_notes: notes?.trim() || null,
        p_completed_offline: isOfflineSync,
      })

      if (completeError) {
        if (completeError.code === 'P0001') {
          return NextResponse.json({ error: 'This check-in has already been recorded.' }, { status: 409 })
        }
        console.error('complete_checkin RPC error:', completeError)
        return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 })
      }
    } else if (checkIn.status === 'missed' && isOfflineSync) {
      // RECONCILIATION: Worker was offline, cron marked it missed,
      // but worker actually checked in on time (device_time < token_expires_at).
      // The RPC validates that device_time is within the token window.
      const { error: reconcileError } = await admin.rpc('reconcile_offline_checkin', {
        p_checkin_id: checkIn.id,
        p_completed_at: completedAt,
        p_server_received_at: serverTime,
        p_latitude: latitude ?? null,
        p_longitude: longitude ?? null,
        p_gps_accuracy: gps_accuracy ?? null,
        p_notes: notes?.trim() || null,
      })

      if (reconcileError) {
        if (reconcileError.code === 'P0001') {
          // Device time was after expiry — can't reconcile, it was genuinely missed
          console.log(`Reconciliation rejected for ${checkIn.id}: device_time after expiry`)
          return NextResponse.json({ error: 'This check-in was missed — device time is after the window.' }, { status: 409 })
        }
        console.error('reconcile_offline_checkin RPC error:', reconcileError)
        return NextResponse.json({ error: 'Failed to reconcile offline check-in' }, { status: 500 })
      }

      wasReconciled = true

      // Log reconciliation alert so supervisor knows
      const facility = watch.facilities
      const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name
      const { error: reconAlertErr } = await admin.from('alerts').insert({
        watch_id: watch.id,
        check_in_id: checkIn.id,
        alert_type: 'sms_sent', // reuse existing type for audit trail
        message: `Offline reconciliation: ${checkIn.assigned_name} checked in at ${completedAt} (device time) for ${displayName}. Originally marked missed — worker was offline.`,
      })
      if (reconAlertErr) console.error('Failed to log reconciliation alert:', reconAlertErr)

      // Decrement consecutive misses (this check-in wasn't actually missed)
      const currentMisses = watch.consecutive_misses ?? 0
      if (currentMisses > 0) {
        const { error: missErr } = await admin
          .from('watches')
          .update({ consecutive_misses: Math.max(0, currentMisses - 1) })
          .eq('id', watch.id)
        if (missErr) console.error('Failed to decrement consecutive misses:', missErr)
      }
    } else if (checkIn.status === 'missed' && !isOfflineSync) {
      // LATE CHECK-IN: Cron marked it missed but the worker is still on the page.
      // Allow within a 5-minute grace period after token expiry.
      const GRACE_PERIOD_MIN = 5
      const expiryMs = new Date(checkIn.token_expires_at).getTime()
      const serverMs = new Date(serverTime).getTime()

      if (serverMs > expiryMs + GRACE_PERIOD_MIN * 60 * 1000) {
        return NextResponse.json({ error: 'This check-in window has expired' }, { status: 410 })
      }

      const { error: lateError } = await admin.rpc('complete_late_checkin', {
        p_checkin_id: checkIn.id,
        p_completed_at: completedAt,
        p_server_received_at: serverTime,
        p_latitude: latitude ?? null,
        p_longitude: longitude ?? null,
        p_gps_accuracy: gps_accuracy ?? null,
        p_notes: notes?.trim() || null,
        p_grace_period_min: GRACE_PERIOD_MIN,
      })

      if (lateError) {
        if (lateError.code === 'P0001') {
          return NextResponse.json({ error: 'This check-in window has expired' }, { status: 410 })
        }
        console.error('complete_late_checkin RPC error:', lateError)
        return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 })
      }

      wasReconciled = true // Cron already created the next check-in

      // Log that this was a late recovery
      const facility = watch.facilities
      const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name
      const { error: lateAlertErr } = await admin.from('alerts').insert({
        watch_id: watch.id,
        check_in_id: checkIn.id,
        alert_type: 'sms_sent',
        message: `Late check-in recovered: ${checkIn.assigned_name} checked in at ${completedAt} for ${displayName}. Originally marked missed by cron — worker was still on page.`,
      })
      if (lateAlertErr) console.error('Failed to log late check-in alert:', lateAlertErr)

      // Decrement consecutive misses (this wasn't actually missed)
      const currentMisses = watch.consecutive_misses ?? 0
      if (currentMisses > 0) {
        const { error: missErr } = await admin
          .from('watches')
          .update({ consecutive_misses: Math.max(0, currentMisses - 1) })
          .eq('id', watch.id)
        if (missErr) console.error('Failed to decrement consecutive misses:', missErr)
      }
    } else {
      return NextResponse.json({ error: 'This check-in window has expired' }, { status: 410 })
    }

    // Reset consecutive misses on successful check-in (non-reconciliation)
    if (!wasReconciled) {
      const { error: resetErr } = await admin
        .from('watches')
        .update({ consecutive_misses: 0 })
        .eq('id', checkIn.watch_id)
      if (resetErr) console.error('Failed to reset consecutive misses:', resetErr)
    }

    const facility = watch.facilities
    const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('Missing NEXT_PUBLIC_APP_URL')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Schedule next check-in (only if not a reconciliation — cron already created the next one)
    let nextToken: string | undefined
    let nextScheduledTime = addMinutes(new Date(checkIn.scheduled_time), watch.check_interval_min)

    if (!wasReconciled) {
      const nextExpiresAt = addMinutes(nextScheduledTime, watch.check_interval_min)
      nextToken = generateToken()
      const nextCheckInUrl = `${appUrl}/checkin/${nextToken}`

      const { data: nextCheckIn, error: nextCheckInError } = await admin
        .from('check_ins')
        .insert({
          watch_id: watch.id,
          scheduled_time: nextScheduledTime.toISOString(),
          token_expires_at: nextExpiresAt.toISOString(),
          status: 'pending',
          token: nextToken,
          assigned_name: checkIn.assigned_name,
        })
        .select()
        .single()

      if (nextCheckInError) {
        nextToken = undefined
      } else if (nextCheckIn) {
        // Send next SMS
        const twilioSid = await sendCheckInSMS(
          watch.assigned_phone,
          displayName,
          checkIn.assigned_name,
          nextCheckInUrl,
          nextScheduledTime
        )

        const { error: alertError } = await admin.from('alerts').insert({
          watch_id: watch.id,
          check_in_id: nextCheckIn.id,
          alert_type: twilioSid ? 'sms_sent' : 'sms_failed',
          recipient_phone: watch.assigned_phone,
          recipient_name: checkIn.assigned_name,
          message: `Check-in SMS for ${nextScheduledTime.toISOString()}`,
          delivery_status: twilioSid ? 'sent' : 'failed',
          twilio_sid: twilioSid,
        })
        if (alertError) {
          console.error('Failed to log check-in alert:', alertError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      serverTime,
      nextCheckIn: nextScheduledTime.toISOString(),
      nextToken,
      facilityName: displayName,
      assignedName: checkIn.assigned_name,
      reconciled: wasReconciled,
      completedOffline: isOfflineSync,
      // Geofence data for client
      watchLatitude: watch.watch_latitude ?? null,
      watchLongitude: watch.watch_longitude ?? null,
      watchRadiusM: watch.watch_radius_m ?? 100,
      escalationPhone: watch.escalation_phone ?? null,
    })
  } catch (err) {
    console.error('Check-in error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
