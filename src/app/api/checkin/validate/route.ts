import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, addMinutes } from 'date-fns'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date()

  const { data: checkIn, error } = await admin
    .from('check_ins')
    .select('*, watches(*, facilities(*))')
    .eq('token', token)
    .single()

  if (error || !checkIn) {
    return NextResponse.json({ error: 'Invalid check-in link' }, { status: 404 })
  }

  if (checkIn.status !== 'pending') {
    if (checkIn.status === 'completed') {
      return NextResponse.json({ error: 'This check-in has already been completed.' }, { status: 410 })
    }
    return NextResponse.json({ error: 'This check-in window is no longer valid.' }, { status: 410 })
  }

  if (now > new Date(checkIn.token_expires_at)) {
    return NextResponse.json({ error: 'This check-in window has expired.' }, { status: 410 })
  }

  if (checkIn.watches.status !== 'active') {
    return NextResponse.json({ error: 'This fire watch has ended.' }, { status: 410 })
  }

  // Gate: if this watch has a checklist, it must be completed before check-ins are accepted
  if (checkIn.watches.checklist_token && !checkIn.watches.checklist_completed_at) {
    return NextResponse.json(
      { error: 'checklist_pending', message: 'You must complete the pre-watch safety checklist before checking in.' },
      { status: 409 }
    )
  }

  const nextTime = addMinutes(new Date(checkIn.scheduled_time), checkIn.watches.check_interval_min)

  return NextResponse.json({
    facilityName: checkIn.watches.facilities.name,
    assignedName: checkIn.assigned_name,
    scheduledTime: checkIn.scheduled_time,
    expiresAt: checkIn.token_expires_at,
    nextTime: nextTime.toISOString(),
    interval: checkIn.watches.check_interval_min,
  })
}
