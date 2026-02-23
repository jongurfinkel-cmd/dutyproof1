import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWatchSummarySMS } from '@/lib/twilio'
import { formatDuration, intervalToDuration } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { watchId } = await req.json()
    if (!watchId) return NextResponse.json({ error: 'watchId required' }, { status: 400 })

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
    await admin
      .from('watches')
      .update({
        status: 'completed',
        ended_at: endedAt,
        ended_by: user.id,
        end_time: endedAt,
      })
      .eq('id', watchId)

    // Cancel pending check-ins using the DB function
    await admin.rpc('cancel_watch_checkins', { p_watch_id: watchId })

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

    // Send summary SMS to admin (using their phone from the watch's assigned_phone as fallback)
    // In production you'd store admin phone. For MVP, send to assigned person too.
    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/watches/${watchId}`
    await sendWatchSummarySMS(
      watch.assigned_phone,
      watch.facilities.name,
      durationStr,
      total,
      completed,
      missed,
      reportUrl
    )

    // Log watch ended
    await admin.from('alerts').insert({
      watch_id: watchId,
      alert_type: 'watch_ended',
      message: `Watch ended. ${completed}/${total} check-ins completed.`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('End watch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
