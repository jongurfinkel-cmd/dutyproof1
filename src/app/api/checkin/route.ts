import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/tokens'
import { sendCheckInSMS } from '@/lib/twilio'
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
    const { token, latitude, longitude, gps_accuracy, device_time } = body

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

    const admin = createAdminClient()
    const serverTime = new Date().toISOString()

    // Find the check-in by token
    const { data: checkIn, error: findError } = await admin
      .from('check_ins')
      .select('*, watches(*, facilities(*))')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (findError || !checkIn) {
      return NextResponse.json({ error: 'Invalid or already used token' }, { status: 404 })
    }

    // Check expiration
    if (new Date(serverTime) > new Date(checkIn.token_expires_at)) {
      return NextResponse.json({ error: 'This check-in window has expired' }, { status: 410 })
    }

    // Check watch is still active
    if (checkIn.watches.status !== 'active') {
      return NextResponse.json({ error: 'This watch has ended' }, { status: 410 })
    }

    // Use device_time as completed_at if provided (offline queue), otherwise server time.
    // server_received_at is always the true server time for audit integrity.
    const completedAt = (device_time && typeof device_time === 'string' && !isNaN(new Date(device_time).getTime()))
      ? new Date(device_time).toISOString()
      : serverTime

    // Mark check-in as completed via the DB function (bypasses immutability RLS)
    const { error: completeError } = await admin.rpc('complete_checkin', {
      p_checkin_id: checkIn.id,
      p_completed_at: completedAt,
      p_server_received_at: serverTime,
      p_latitude: latitude ?? null,
      p_longitude: longitude ?? null,
      p_gps_accuracy: gps_accuracy ?? null,
    })

    if (completeError) {
      // Race condition: two requests for the same token — RPC rejects the second.
      // Supabase wraps RAISE EXCEPTION as code P0001 (raise_exception).
      if (completeError.code === 'P0001') {
        return NextResponse.json({ error: 'This check-in has already been recorded.' }, { status: 409 })
      }
      console.error('complete_checkin RPC error:', completeError)
      return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 })
    }

    const watch = checkIn.watches
    if (!watch || !watch.facilities) {
      console.error('Check-in missing watch/facility join data:', checkIn.id)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    const facility = watch.facilities
    const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('Missing NEXT_PUBLIC_APP_URL')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Schedule next check-in
    const nextScheduledTime = addMinutes(new Date(checkIn.scheduled_time), watch.check_interval_min)
    const nextExpiresAt = addMinutes(nextScheduledTime, watch.check_interval_min)
    const nextToken = generateToken()
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

    if (!nextCheckInError && nextCheckIn) {
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

    return NextResponse.json({
      success: true,
      serverTime,
      nextCheckIn: nextScheduledTime.toISOString(),
    })
  } catch (err) {
    console.error('Check-in error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
