import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCheckInSMS, sendChecklistSMS } from '@/lib/sms'
import { generateToken } from '@/lib/tokens'
import { addMinutes } from 'date-fns'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowSec: 60, prefix: 'sms-confirm' })
  if (limited) return limited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { token } = body
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Find the watch by consent token
  const { data: watch, error: watchErr } = await admin
    .from('watches')
    .select('id, status, sms_consent_confirmed_at, assigned_name, assigned_phone, facility_id, check_interval_min, session_token, checklist_token')
    .eq('sms_consent_token', token)
    .single()

  if (watchErr || !watch) {
    return NextResponse.json({ error: 'Invalid or expired consent token' }, { status: 404 })
  }

  if (watch.status !== 'active') {
    return NextResponse.json({ error: 'Watch is no longer active' }, { status: 400 })
  }

  // Already confirmed
  if (watch.sms_consent_confirmed_at) {
    return NextResponse.json({ error: 'Already confirmed', code: 'already_confirmed' }, { status: 409 })
  }

  // Mark consent as confirmed — atomic: only update if still null (prevents race condition)
  const { data: updated, error: updateErr } = await admin
    .from('watches')
    .update({ sms_consent_confirmed_at: new Date().toISOString() })
    .eq('id', watch.id)
    .is('sms_consent_confirmed_at', null)
    .select('id')

  if (updateErr) {
    console.error('Failed to confirm SMS consent:', updateErr)
    return NextResponse.json({ error: 'Failed to confirm consent' }, { status: 500 })
  }

  // Another request confirmed first — race condition caught
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'Already confirmed', code: 'already_confirmed' }, { status: 409 })
  }

  // Get facility name for SMS
  const { data: facility } = await admin
    .from('facilities')
    .select('name, timezone')
    .eq('id', watch.facility_id)
    .single()

  const facilityName = facility?.name ?? 'your job site'
  const tz = facility?.timezone ?? 'America/New_York'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dutyproof.com'

  // Now send the first operational SMS (checklist or check-in)
  if (watch.assigned_phone) {
    // If there's a checklist, send that first
    if (watch.checklist_token) {
      const checklistUrl = `${baseUrl}/checklist/${watch.checklist_token}`
      await sendChecklistSMS(watch.assigned_phone, watch.assigned_name, facilityName, checklistUrl)
    }

    // Find the current pending check-in and send the check-in SMS
    const { data: pendingCheckIn } = await admin
      .from('check_ins')
      .select('id, token, scheduled_time')
      .eq('watch_id', watch.id)
      .eq('status', 'pending')
      .order('scheduled_time', { ascending: true })
      .limit(1)
      .single()

    if (pendingCheckIn) {
      const checkInUrl = watch.session_token
        ? `${baseUrl}/checkin/${watch.session_token}`
        : `${baseUrl}/checkin/${pendingCheckIn.token}`
      await sendCheckInSMS(
        watch.assigned_phone,
        facilityName,
        watch.assigned_name,
        checkInUrl,
        new Date(pendingCheckIn.scheduled_time),
        tz
      )
    }
  }

  // Log an alert for the consent confirmation
  await admin.from('alerts').insert({
    watch_id: watch.id,
    alert_type: 'sms_sent',
    recipient_phone: watch.assigned_phone,
    recipient_name: watch.assigned_name,
    message: 'Watcher confirmed SMS consent via double opt-in',
    delivery_status: 'delivered',
  })

  return NextResponse.json({ success: true })
}
