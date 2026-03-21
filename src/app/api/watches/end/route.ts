import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { sendWatchSummarySMS } from '@/lib/sms'
import { addMinutes, formatDuration, intervalToDuration } from 'date-fns'

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowSec: 60, prefix: 'watch-end' })
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any
    try { parsed = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { watchId } = parsed
    if (!watchId || typeof watchId !== 'string') return NextResponse.json({ error: 'watchId required' }, { status: 400 })
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(watchId)) {
      return NextResponse.json({ error: 'Invalid watchId format' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch watch with facility
    const { data: watch, error: watchError } = await admin
      .from('watches')
      .select('*, facilities(*)')
      .eq('id', watchId)
      .eq('owner_id', user.id)
      .single()

    if (watchError || !watch) {
      return NextResponse.json({ error: 'Watch not found' }, { status: 404 })
    }

    if (watch.status !== 'active') {
      return NextResponse.json({ error: 'Watch is not active' }, { status: 400 })
    }

    // Handle "stop work" action (sets work_stopped_at without ending the watch)
    if (parsed.action === 'stop_work') {
      if (watch.work_stopped_at) {
        return NextResponse.json({ error: 'Work already stopped', work_stopped_at: watch.work_stopped_at }, { status: 400 })
      }
      const { error: stopError } = await admin
        .from('watches')
        .update({ work_stopped_at: new Date().toISOString() })
        .eq('id', watchId)
      if (stopError) {
        return NextResponse.json({ error: 'Failed to stop work' }, { status: 500 })
      }
      return NextResponse.json({ success: true, work_stopped_at: new Date().toISOString() })
    }

    // Validate closeout fields
    if (parsed.closeout_notes && (typeof parsed.closeout_notes !== 'string' || parsed.closeout_notes.length > 2000)) {
      return NextResponse.json({ error: 'closeout_notes must be a string of 2000 characters or fewer' }, { status: 400 })
    }
    if (parsed.closeout_photo_urls && (!Array.isArray(parsed.closeout_photo_urls) || !parsed.closeout_photo_urls.every((u: unknown) => typeof u === 'string'))) {
      return NextResponse.json({ error: 'closeout_photo_urls must be an array of strings' }, { status: 400 })
    }

    // Post-work enforcement: if work_stopped_at is set, check if enough time has passed
    if (watch.post_work_duration_min > 0 && !parsed.force) {
      if (!watch.work_stopped_at) {
        // Work hasn't been stopped yet - need to stop work first
        return NextResponse.json({
          error: 'post_work_required',
          message: 'Hot work must be stopped before ending the watch. Use the "Stop Work" action first, then wait for the post-work monitoring period to complete.',
          post_work_duration_min: watch.post_work_duration_min,
        }, { status: 409 })
      }

      const workStoppedAt = new Date(watch.work_stopped_at)
      const postWorkEnd = addMinutes(workStoppedAt, watch.post_work_duration_min)
      const now = new Date()

      if (now < postWorkEnd) {
        const remainingMs = postWorkEnd.getTime() - now.getTime()
        const remainingMin = Math.ceil(remainingMs / 60000)
        return NextResponse.json({
          error: 'post_work_incomplete',
          message: `Post-work monitoring period not complete. ${remainingMin} minute(s) remaining.`,
          remaining_minutes: remainingMin,
          post_work_ends_at: postWorkEnd.toISOString(),
        }, { status: 409 })
      }
    }

    // Impairment watch closeout validation
    if (watch.watch_type === 'impairment' && !parsed.force) {
      if (!parsed.system_restored) {
        return NextResponse.json({
          error: 'restoration_required',
          message: 'Impairment watches require confirmation that the system has been restored to service.',
        }, { status: 409 })
      }
      if (!parsed.restoration_verified_by || typeof parsed.restoration_verified_by !== 'string' || !parsed.restoration_verified_by.trim()) {
        return NextResponse.json({
          error: 'verifier_required',
          message: 'Name of the person who verified system restoration is required.',
        }, { status: 409 })
      }
    }

    const endedAt = new Date().toISOString()

    // Build update data with closeout evidence
    const updateData: Record<string, unknown> = {
      status: 'completed',
      ended_at: endedAt,
      ended_by: user.id,
      closeout_notes: parsed.closeout_notes || null,
      closeout_photo_urls: parsed.closeout_photo_urls || null,
    }

    if (watch.watch_type === 'impairment' && parsed.system_restored) {
      updateData.system_restored = true
      updateData.restoration_verified_by = parsed.restoration_verified_by?.trim() || null
      updateData.restoration_verified_at = endedAt
    }

    // Close the watch
    const { error: updateError } = await admin
      .from('watches')
      .update(updateData)
      .eq('id', watchId)

    if (updateError) {
      console.error('Watch update error:', updateError)
      return NextResponse.json({ error: 'Failed to end watch' }, { status: 500 })
    }

    // Cancel pending check-ins using the DB function
    const { error: cancelError } = await admin.rpc('cancel_watch_checkins', { p_watch_id: watchId })
    if (cancelError) {
      console.error('Cancel check-ins RPC error:', cancelError)
    }

    // Get check-in stats
    const { data: checkIns } = await admin
      .from('check_ins')
      .select('status')
      .eq('watch_id', watchId)

    const completed = (checkIns ?? []).filter((c) => c.status === 'completed').length
    const missed = (checkIns ?? []).filter((c) => c.status === 'missed').length
    const total = completed + missed

    // Calculate duration
    const startDate = new Date(watch.start_time)
    const endDate = new Date(endedAt)
    const duration = intervalToDuration({ start: startDate, end: endDate })
    const durationStr = formatDuration(duration, { format: ['hours', 'minutes'] }) || 'Less than a minute'

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('Missing NEXT_PUBLIC_APP_URL')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const reportUrl = `${appUrl}/watches/${watchId}`

    // Notify the assigned worker (only if SMS is configured and watcher consented)
    if (watch.assigned_phone && watch.sms_consent_confirmed_at) {
      const workerSmsSid = await sendWatchSummarySMS(
        watch.assigned_phone,
        watch.facilities.name,
        durationStr,
        total,
        completed,
        missed,
        reportUrl
      )
      if (!workerSmsSid) {
        console.error('Failed to send summary SMS to worker:', watch.assigned_phone)
      }
    }

    // Also notify the supervisor/escalation contact if one was set and is different
    if (watch.escalation_phone && watch.escalation_phone !== watch.assigned_phone) {
      const supervisorSmsSid = await sendWatchSummarySMS(
        watch.escalation_phone,
        watch.facilities.name,
        durationStr,
        total,
        completed,
        missed,
        reportUrl
      )
      if (!supervisorSmsSid) {
        console.error('Failed to send summary SMS to supervisor:', watch.escalation_phone)
      }
    }

    // Log watch ended
    const { error: endAlertErr } = await admin.from('alerts').insert({
      watch_id: watchId,
      alert_type: 'watch_ended',
      message: `Watch ended. ${completed}/${total} check-ins completed.`,
    })
    if (endAlertErr) console.error('Failed to log watch_ended alert:', endAlertErr)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('End watch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
