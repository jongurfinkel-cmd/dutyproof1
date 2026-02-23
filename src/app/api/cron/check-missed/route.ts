import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/tokens'
import { sendCheckInSMS, sendAlertSMS } from '@/lib/twilio'
import { addMinutes } from 'date-fns'

export async function GET(req: NextRequest) {
  // Protect with cron secret — accepts x-cron-secret header, ?secret= query param,
  // or Vercel's automatic Authorization: Bearer <CRON_SECRET> header
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const secret =
    req.headers.get('x-cron-secret') ||
    req.nextUrl.searchParams.get('secret') ||
    bearerToken
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  let missedCount = 0
  let errors: string[] = []

  try {
    // Find expired pending check-ins for active watches
    const { data: expiredCheckIns, error: fetchError } = await admin
      .from('check_ins')
      .select('*, watches(*, facilities(*))')
      .eq('status', 'pending')
      .lt('token_expires_at', now)

    if (fetchError) {
      console.error('Cron fetch error:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    for (const checkIn of expiredCheckIns ?? []) {
      const watch = checkIn.watches
      if (!watch || watch.status !== 'active') continue

      const facility = watch.facilities
      const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name

      try {
        // Mark as missed via DB function
        const { error: missError } = await admin.rpc('mark_checkin_missed', {
          p_checkin_id: checkIn.id,
        })

        if (missError) {
          errors.push(`Failed to mark ${checkIn.id} as missed: ${missError.message}`)
          continue
        }

        missedCount++

        // Send alert SMS to admin (using assigned phone for MVP — in production store admin phone separately)
        const alertSid = await sendAlertSMS(
          watch.assigned_phone,
          checkIn.assigned_name,
          displayName,
          new Date(checkIn.scheduled_time)
        )

        // Log missed check-in alert
        await admin.from('alerts').insert({
          watch_id: watch.id,
          check_in_id: checkIn.id,
          alert_type: 'missed_checkin',
          recipient_phone: watch.assigned_phone,
          recipient_name: checkIn.assigned_name,
          message: `${checkIn.assigned_name} missed check-in scheduled at ${checkIn.scheduled_time}`,
          delivery_status: alertSid ? 'sent' : 'failed',
          twilio_sid: alertSid,
        })

        // Schedule next check-in
        const nextScheduledTime = addMinutes(
          new Date(checkIn.scheduled_time),
          watch.check_interval_min
        )
        const nextExpiresAt = addMinutes(nextScheduledTime, watch.check_interval_min)
        const nextToken = generateToken()
        const nextCheckInUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkin/${nextToken}`

        const { data: nextCheckIn, error: nextError } = await admin
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

        if (!nextError && nextCheckIn) {
          const nextSid = await sendCheckInSMS(
            watch.assigned_phone,
            displayName,
            checkIn.assigned_name,
            nextCheckInUrl,
            nextScheduledTime,
            facility.timezone
          )

          await admin.from('alerts').insert({
            watch_id: watch.id,
            check_in_id: nextCheckIn.id,
            alert_type: nextSid ? 'sms_sent' : 'sms_failed',
            recipient_phone: watch.assigned_phone,
            recipient_name: checkIn.assigned_name,
            message: `Check-in SMS for ${nextScheduledTime.toISOString()}`,
            delivery_status: nextSid ? 'sent' : 'failed',
            twilio_sid: nextSid,
          })
        }
      } catch (innerErr) {
        errors.push(`Error processing check-in ${checkIn.id}: ${String(innerErr)}`)
      }
    }

    // ── Escalation pass ──────────────────────────────────────────────────────
    // Find missed check-ins that haven't had an escalation SMS sent yet,
    // where the watch has an escalation_phone set and the delay has elapsed.
    const { data: pendingEscalations } = await admin
      .from('check_ins')
      .select('*, watches(*, facilities(*))')
      .eq('status', 'missed')
      .is('escalation_sent_at', null)

    for (const ci of pendingEscalations ?? []) {
      const watch = ci.watches
      if (!watch || watch.status !== 'active' || !watch.escalation_phone) continue

      const escalateAt = new Date(ci.scheduled_time)
      escalateAt.setMinutes(escalateAt.getMinutes() + (watch.escalation_delay_min ?? 0))
      if (new Date() < escalateAt) continue

      try {
        const facility = watch.facilities
        const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name
        const escalationSid = await sendAlertSMS(
          watch.escalation_phone,
          ci.assigned_name,
          displayName,
          new Date(ci.scheduled_time)
        )

        await admin
          .from('check_ins')
          .update({ escalation_sent_at: new Date().toISOString() })
          .eq('id', ci.id)

        await admin.from('alerts').insert({
          watch_id: watch.id,
          check_in_id: ci.id,
          alert_type: 'missed_checkin',
          recipient_phone: watch.escalation_phone,
          recipient_name: 'Escalation',
          message: `Escalation alert sent to supervisor for missed check-in at ${ci.scheduled_time}`,
          delivery_status: escalationSid ? 'sent' : 'failed',
          twilio_sid: escalationSid,
        })
      } catch (innerErr) {
        errors.push(`Escalation error for check-in ${ci.id}: ${String(innerErr)}`)
      }
    }

    return NextResponse.json({
      processed: expiredCheckIns?.length ?? 0,
      missed: missedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
