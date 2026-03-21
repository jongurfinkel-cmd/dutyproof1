import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addMinutes } from 'date-fns'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { limit: 30, windowSec: 60, prefix: 'checkin-validate' })
  if (limited) return limited

  const session = req.nextUrl.searchParams.get('session')
  const token = req.nextUrl.searchParams.get('token')

  // Must have either session or token
  if (!session && !token) {
    return NextResponse.json({ error: 'Missing token or session' }, { status: 400 })
  }

  // Validate format (64 hex chars)
  const key = session || token!
  if (!/^[0-9a-f]{64}$/.test(key)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date()

  // ═══════════════════════════════════════════════════════════
  // SESSION MODE: persistent link for the whole watch
  // ═══════════════════════════════════════════════════════════
  if (session) {
    const { data: watch, error } = await admin
      .from('watches')
      .select('*, facilities(*)')
      .eq('session_token', session)
      .single()

    if (error || !watch) {
      return NextResponse.json({ error: 'Invalid session link' }, { status: 404 })
    }

    if (watch.status !== 'active') {
      return NextResponse.json({ error: 'This fire watch has ended.' }, { status: 410 })
    }

    // Update last_sync_at — proves the watcher's device is online
    await admin
      .from('watches')
      .update({ last_sync_at: now.toISOString() })
      .eq('id', watch.id)

    // Gate: checklist must be completed first
    if (watch.checklist_token && !watch.checklist_completed_at) {
      return NextResponse.json(
        { error: 'checklist_pending', message: 'You must complete the pre-watch safety checklist before checking in.', checklistToken: watch.checklist_token },
        { status: 409 }
      )
    }

    // Find the most recent completed check-in to determine where to resume
    const { data: lastCompleted } = await admin
      .from('check_ins')
      .select('scheduled_time, completed_at')
      .eq('watch_id', watch.id)
      .eq('status', 'completed')
      .order('scheduled_time', { ascending: false })
      .limit(1)
      .single()

    const f = watch.facilities as Record<string, unknown>

    return NextResponse.json({
      mode: 'session',
      // Watch config (cached by client for offline use)
      watchId: watch.id,
      sessionToken: session,
      facilityName: f.name,
      location: watch.location || null,
      assignedName: watch.assigned_name,
      interval: watch.check_interval_min,
      startTime: watch.start_time,
      plannedEndTime: watch.planned_end_time ?? null,
      // Geofence
      watchLatitude: watch.watch_latitude ?? null,
      watchLongitude: watch.watch_longitude ?? null,
      watchRadiusM: watch.watch_radius_m ?? 100,
      // Supervisor
      escalationPhone: watch.escalation_phone ?? null,
      // Post-work
      postWorkDurationMin: watch.post_work_duration_min ?? 0,
      workStoppedAt: watch.work_stopped_at ?? null,
      // Resume info
      lastCompletedAt: lastCompleted?.scheduled_time ?? null,
      // Server time for clock offset calculation
      serverTime: now.toISOString(),
      // Checklist
      checklistCompletedAt: watch.checklist_completed_at ?? null,
    })
  }

  // ═══════════════════════════════════════════════════════════
  // LEGACY MODE: per-check-in rotating token
  // ═══════════════════════════════════════════════════════════
  const { data: checkIn, error } = await admin
    .from('check_ins')
    .select('*, watches(*, facilities(*))')
    .eq('token', token!)
    .single()

  if (error || !checkIn) {
    // Try session lookup as fallback (token might be a session_token)
    const { data: watch } = await admin
      .from('watches')
      .select('session_token')
      .eq('session_token', token!)
      .single()

    if (watch) {
      // Redirect client to use session mode
      return NextResponse.json({ redirect: 'session', sessionToken: token }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid check-in link' }, { status: 404 })
  }

  if (checkIn.status !== 'pending') {
    // If this watch has a session_token, tell the client to switch to session mode
    if (checkIn.watches.session_token) {
      return NextResponse.json({ redirect: 'session', sessionToken: checkIn.watches.session_token }, { status: 200 })
    }
    if (checkIn.status === 'completed') {
      return NextResponse.json({ error: 'This check-in has already been completed.' }, { status: 410 })
    }
    return NextResponse.json({ error: 'This check-in window is no longer valid.' }, { status: 410 })
  }

  if (now > new Date(checkIn.token_expires_at)) {
    // If session_token exists, redirect to session mode instead of giving an error
    if (checkIn.watches.session_token) {
      return NextResponse.json({ redirect: 'session', sessionToken: checkIn.watches.session_token }, { status: 200 })
    }
    return NextResponse.json({ error: 'This check-in window has expired.' }, { status: 410 })
  }

  if (checkIn.watches.status !== 'active') {
    return NextResponse.json({ error: 'This fire watch has ended.' }, { status: 410 })
  }

  // Gate: if this watch has a checklist, it must be completed before check-ins are accepted
  if (checkIn.watches.checklist_token && !checkIn.watches.checklist_completed_at) {
    return NextResponse.json(
      { error: 'checklist_pending', message: 'You must complete the pre-watch safety checklist before checking in.', checklistToken: checkIn.watches.checklist_token },
      { status: 409 }
    )
  }

  const nextTime = addMinutes(new Date(checkIn.scheduled_time), checkIn.watches.check_interval_min)
  const w = checkIn.watches

  return NextResponse.json({
    mode: 'legacy',
    facilityName: w.facilities.name,
    location: w.location || null,
    assignedName: checkIn.assigned_name,
    scheduledTime: checkIn.scheduled_time,
    expiresAt: checkIn.token_expires_at,
    nextTime: nextTime.toISOString(),
    interval: w.check_interval_min,
    // Geofence data
    watchLatitude: w.watch_latitude ?? null,
    watchLongitude: w.watch_longitude ?? null,
    watchRadiusM: w.watch_radius_m ?? 100,
    // Supervisor contact
    escalationPhone: w.escalation_phone ?? null,
    // Stop-work / post-work data
    watchId: w.id,
    postWorkDurationMin: w.post_work_duration_min ?? 0,
    workStoppedAt: w.work_stopped_at ?? null,
    // If session exists, include it so client can upgrade
    sessionToken: w.session_token ?? null,
  })
}
