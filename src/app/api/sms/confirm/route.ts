import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCheckInSMS, sendChecklistSMS } from '@/lib/sms'
import { generateToken } from '@/lib/tokens'
import { addMinutes } from 'date-fns'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
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

  // Mark consent as confirmed
  const { error: updateErr } = await admin
    .from('watches')
    .update({ sms_consent_confirmed_at: new Date().toISOString() })
    .eq('id', watch.id)

  if (updateErr) {
    console.error('Failed to confirm SMS consent:', updateErr)
    return NextResponse.json({ error: 'Failed to confirm consent' }, { status: 500 })
  }

  // Get facility name for SMS
  const { data: facility } = await admin
    .from('facilities')
    .select('name')
    .eq('id', watch.facility_id)
    .single()

  const facilityName = facility?.name ?? 'your job site'
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
        new Date(pendingCheckIn.scheduled_time)
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
