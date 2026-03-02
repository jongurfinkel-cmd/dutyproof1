import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { limit: 30, windowSec: 60, prefix: 'ack-validate' })
  if (limited) return limited

  const token = req.nextUrl.searchParams.get('token')
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: checkIn, error } = await admin
    .from('check_ins')
    .select('*, watches(*, facilities(*))')
    .eq('ack_token', token)
    .single()

  if (error || !checkIn) {
    return NextResponse.json({ error: 'Invalid acknowledgment link' }, { status: 404 })
  }

  if (checkIn.ack_at) {
    return NextResponse.json(
      { error: 'already_acknowledged', message: 'This alert has already been acknowledged.' },
      { status: 410 }
    )
  }

  if (checkIn.status !== 'missed') {
    return NextResponse.json({ error: 'This check-in is no longer in a missed state.' }, { status: 410 })
  }

  if (!checkIn.escalation_sent_at) {
    return NextResponse.json({ error: 'No escalation was sent for this check-in.' }, { status: 410 })
  }

  const watch = checkIn.watches
  const facility = watch.facilities

  return NextResponse.json({
    facilityName: watch.location ? `${facility.name} — ${watch.location}` : facility.name,
    assignedName: checkIn.assigned_name,
    scheduledTime: checkIn.scheduled_time,
    escalationSentAt: checkIn.escalation_sent_at,
    watchStatus: watch.status,
  })
}
