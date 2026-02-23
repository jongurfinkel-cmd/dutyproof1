import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/tokens'
import { sendCheckInSMS } from '@/lib/twilio'
import { addMinutes } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, latitude, longitude, gps_accuracy, device_time } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
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

    // Mark check-in as completed via the DB function (bypasses immutability RLS)
    const { error: completeError } = await admin.rpc('complete_checkin', {
      p_checkin_id: checkIn.id,
      p_completed_at: device_time || serverTime,
      p_server_received_at: serverTime,
      p_latitude: latitude ?? null,
      p_longitude: longitude ?? null,
      p_gps_accuracy: gps_accuracy ?? null,
    })

    if (completeError) {
      console.error('complete_checkin RPC error:', completeError)
      return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 })
    }

    const watch = checkIn.watches
    const facility = watch.facilities

    // Schedule next check-in
    const nextScheduledTime = addMinutes(new Date(checkIn.scheduled_time), watch.check_interval_min)
    const nextExpiresAt = addMinutes(nextScheduledTime, watch.check_interval_min)
    const nextToken = generateToken()
    const nextCheckInUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkin/${nextToken}`

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
        facility.name,
        checkIn.assigned_name,
        nextCheckInUrl,
        nextScheduledTime,
        facility.timezone
      )

      await admin.from('alerts').insert({
        watch_id: watch.id,
        check_in_id: nextCheckIn.id,
        alert_type: twilioSid ? 'sms_sent' : 'sms_failed',
        recipient_phone: watch.assigned_phone,
        recipient_name: checkIn.assigned_name,
        message: `Check-in SMS for ${nextScheduledTime.toISOString()}`,
        delivery_status: twilioSid ? 'sent' : 'failed',
        twilio_sid: twilioSid,
      })
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
