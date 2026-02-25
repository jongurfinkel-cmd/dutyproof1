import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/tokens'
import { addMinutes } from 'date-fns'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Must be authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { watchId } = await req.json()
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

    // Find the pending check-in for this watch
    const { data: checkIn, error: checkInError } = await admin
      .from('check_ins')
      .select('*')
      .eq('watch_id', watchId)
      .eq('status', 'pending')
      .order('scheduled_time', { ascending: true })
      .limit(1)
      .single()

    if (checkInError || !checkIn) {
      return NextResponse.json({ error: 'No pending check-in found' }, { status: 404 })
    }

    const serverTime = new Date().toISOString()

    // Complete the check-in (same RPC as the real flow)
    const { error: completeError } = await admin.rpc('complete_checkin', {
      p_checkin_id: checkIn.id,
      p_completed_at: serverTime,
      p_server_received_at: serverTime,
      p_latitude: null,
      p_longitude: null,
      p_gps_accuracy: null,
    })

    if (completeError) {
      console.error('simulate complete_checkin error:', completeError)
      return NextResponse.json({ error: 'Failed to record simulated check-in' }, { status: 500 })
    }

    // Schedule next check-in from now (so they can simulate again immediately)
    const nextScheduledTime = addMinutes(new Date(), watch.check_interval_min)
    const nextExpiresAt = addMinutes(nextScheduledTime, watch.check_interval_min)
    const nextToken = generateToken()

    const { data: nextCheckIn, error: nextError } = await admin
      .from('check_ins')
      .insert({
        watch_id: watchId,
        scheduled_time: nextScheduledTime.toISOString(),
        token_expires_at: nextExpiresAt.toISOString(),
        status: 'pending',
        token: nextToken,
        assigned_name: checkIn.assigned_name,
      })
      .select()
      .single()

    if (!nextError && nextCheckIn) {
      const { error: alertError } = await admin.from('alerts').insert({
        watch_id: watchId,
        check_in_id: nextCheckIn.id,
        alert_type: 'sms_sent',
        recipient_phone: watch.assigned_phone,
        recipient_name: checkIn.assigned_name,
        message: `[SIMULATED] Check-in SMS for ${nextScheduledTime.toISOString()}`,
        delivery_status: 'simulated',
        twilio_sid: null,
      })
      if (alertError) console.error('Failed to log simulated alert:', alertError)
    }

    return NextResponse.json({ success: true, nextCheckIn: nextScheduledTime.toISOString() })
  } catch (err) {
    console.error('Simulate check-in error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
