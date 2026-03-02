import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCheckInSMS } from '@/lib/twilio'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { limit: 3, windowSec: 60, prefix: 'resend-sms' })
    if (limited) return limited
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

    // Verify the watch belongs to this user and is active
    const { data: watch, error: watchError } = await admin
      .from('watches')
      .select('*, facilities(*)')
      .eq('id', watchId)
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .single()

    if (watchError || !watch) {
      return NextResponse.json({ error: 'Active watch not found' }, { status: 404 })
    }

    // Find the current pending check-in
    const { data: checkIn, error: checkInError } = await admin
      .from('check_ins')
      .select('*')
      .eq('watch_id', watchId)
      .eq('status', 'pending')
      .order('scheduled_time', { ascending: true })
      .limit(1)
      .single()

    if (checkInError || !checkIn) {
      return NextResponse.json({ error: 'No pending check-in to resend' }, { status: 404 })
    }

    // Reject if the token has already expired — worker would get a dead link
    if (new Date() > new Date(checkIn.token_expires_at)) {
      return NextResponse.json({ error: 'Check-in window has expired. A new one will be sent shortly.' }, { status: 410 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('Missing NEXT_PUBLIC_APP_URL')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    const checkInUrl = `${appUrl}/checkin/${checkIn.token}`

    const sid = await sendCheckInSMS(
      watch.assigned_phone,
      watch.facilities.name,
      watch.assigned_name,
      checkInUrl,
      new Date(checkIn.scheduled_time)
    )

    // Log the resend in alerts
    const { error: alertError } = await admin.from('alerts').insert({
      watch_id: watchId,
      check_in_id: checkIn.id,
      alert_type: 'sms_sent',
      recipient_phone: watch.assigned_phone,
      recipient_name: watch.assigned_name,
      message: `[RESEND] Check-in SMS resent manually`,
      delivery_status: sid ? 'sent' : 'failed',
      twilio_sid: sid,
    })
    if (alertError) {
      console.error('Failed to log resend alert:', alertError)
    }

    if (!sid) {
      return NextResponse.json({ error: 'SMS delivery failed — check Twilio config' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Resend SMS error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
