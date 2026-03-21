import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { sendStopWorkSMS } from '@/lib/sms'

/**
 * POST /api/checkin/stop-work
 * Allows a fire watch to signal that hot work has finished early.
 * Auth is via check-in token (the fire watch is not logged in).
 * Sets work_stopped_at on the watch and notifies the supervisor.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowSec: 60, prefix: 'checkin-stopwork' })
  if (limited) return limited

  const body = await req.json().catch(() => null)
  if (!body?.token || typeof body.token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Validate the token belongs to a pending check-in on an active watch
  const { data: checkIn, error } = await admin
    .from('check_ins')
    .select('watch_id, watches(id, status, work_stopped_at, post_work_duration_min, escalation_phone, assigned_name, facilities(name))')
    .eq('token', body.token)
    .single()

  if (error || !checkIn) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  const watch = checkIn.watches as unknown as Record<string, unknown>
  if (watch.status !== 'active') {
    return NextResponse.json({ error: 'Watch is not active' }, { status: 400 })
  }
  if (watch.work_stopped_at) {
    return NextResponse.json({ error: 'Work already stopped', work_stopped_at: watch.work_stopped_at }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { error: updateError } = await admin
    .from('watches')
    .update({ work_stopped_at: now })
    .eq('id', watch.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to stop work' }, { status: 500 })
  }

  // Send SMS notification to supervisor
  const escalationPhone = watch.escalation_phone as string | null
  if (escalationPhone) {
    const facility = watch.facilities as Record<string, unknown>
    const facilityName = (facility?.name as string) || 'Unknown facility'
    const assignedName = watch.assigned_name as string
    const postWorkMin = watch.post_work_duration_min as number

    const sid = await sendStopWorkSMS(escalationPhone, assignedName, facilityName, postWorkMin)

    const { error: alertErr } = await admin.from('alerts').insert({
      watch_id: watch.id as string,
      alert_type: sid ? 'sms_sent' : 'sms_failed',
      recipient_phone: escalationPhone,
      recipient_name: 'Supervisor',
      message: `Hot work completed. ${assignedName} has started the ${postWorkMin}-minute post-work monitoring period at ${facilityName}.`,
      delivery_status: sid ? 'sent' : 'failed',
      twilio_sid: sid,
    })
    if (alertErr) console.error('Failed to log stop-work alert:', alertErr)
  }

  return NextResponse.json({ success: true, work_stopped_at: now })
}
