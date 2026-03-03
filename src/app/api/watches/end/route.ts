import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { sendWatchSummarySMS } from '@/lib/twilio'
import { formatDuration, intervalToDuration } from 'date-fns'

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

    const endedAt = new Date().toISOString()

    // Close the watch
    const { error: updateError } = await admin
      .from('watches')
      .update({
        status: 'completed',
        ended_at: endedAt,
        ended_by: user.id,
      })
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

    // Always notify the assigned worker
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
