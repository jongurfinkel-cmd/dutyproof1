import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { generateToken } from '@/lib/tokens'
import { sendCheckInSMS } from '@/lib/sms'
import { addMinutes } from 'date-fns'

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowSec: 60, prefix: 'watch-handoff' })
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

    const { watchId, new_assigned_name, new_assigned_phone, reason, sms_enabled } = parsed

    // Validate watchId
    if (!watchId || typeof watchId !== 'string') {
      return NextResponse.json({ error: 'watchId required' }, { status: 400 })
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(watchId)) {
      return NextResponse.json({ error: 'Invalid watchId format' }, { status: 400 })
    }

    // Validate new watcher name
    if (!new_assigned_name || typeof new_assigned_name !== 'string') {
      return NextResponse.json({ error: 'New watcher name is required' }, { status: 400 })
    }
    const trimmedName = new_assigned_name.trim()
    if (!trimmedName || trimmedName.length > 100) {
      return NextResponse.json({ error: 'Name must be 1-100 characters' }, { status: 400 })
    }

    // Validate phone if provided
    const e164Regex = /^\+[1-9]\d{1,14}$/
    if (new_assigned_phone && !e164Regex.test(new_assigned_phone)) {
      return NextResponse.json({ error: 'Phone must be E.164 format (e.g. +12125551234)' }, { status: 400 })
    }

    // Validate reason
    if (reason && (typeof reason !== 'string' || reason.length > 500)) {
      return NextResponse.json({ error: 'Reason must be under 500 characters' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch the watch
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

    const oldName = watch.assigned_name
    const oldPhone = watch.assigned_phone

    // 1. Cancel all pending check-ins
    const { error: cancelError } = await admin.rpc('cancel_watch_checkins', { p_watch_id: watchId })
    if (cancelError) {
      console.error('Failed to cancel check-ins during handoff:', cancelError)
      return NextResponse.json({ error: 'Failed to process handoff' }, { status: 500 })
    }

    // 2. Regenerate session_token so the old watcher's persistent link stops working
    const newSessionToken = generateToken()

    // Update the watch with new watcher info and new session_token
    const updatedPhone = new_assigned_phone || oldPhone
    const { error: updateError } = await admin
      .from('watches')
      .update({
        assigned_name: trimmedName,
        assigned_phone: updatedPhone,
        session_token: newSessionToken,
      })
      .eq('id', watchId)

    if (updateError) {
      console.error('Failed to update watch during handoff:', updateError)
      return NextResponse.json({ error: 'Failed to update watcher' }, { status: 500 })
    }

    // 3. Log the handoff
    const handoffMessage = `[HANDOFF] Watcher reassigned from old_assigned_name="${oldName}" to new_assigned_name="${trimmedName}". ${reason ? `Reason: ${reason}` : 'No reason provided.'}`
    await admin.from('alerts').insert({
      watch_id: watchId,
      alert_type: 'watch_started', // Using watch_started with [HANDOFF] prefix
      message: handoffMessage,
    })

    // 4. Create new check-in for the new watcher
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const now = new Date()
    const scheduledTime = now
    const expiresAt = addMinutes(scheduledTime, watch.check_interval_min)
    const token = generateToken()
    const checkInUrl = `${appUrl}/checkin/${newSessionToken}`

    const { data: newCheckIn, error: checkInError } = await admin
      .from('check_ins')
      .insert({
        watch_id: watchId,
        scheduled_time: scheduledTime.toISOString(),
        token_expires_at: expiresAt.toISOString(),
        status: 'pending',
        token,
        assigned_name: trimmedName,
      })
      .select()
      .single()

    if (checkInError || !newCheckIn) {
      console.error('Failed to create check-in during handoff:', checkInError)
      // Non-fatal - handoff itself succeeded
    }

    // 5. Send SMS to new watcher if enabled
    const facility = watch.facilities
    const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name

    if (sms_enabled && updatedPhone && newCheckIn) {
      const sid = await sendCheckInSMS(
        updatedPhone,
        displayName,
        trimmedName,
        checkInUrl,
        scheduledTime
      )

      await admin.from('alerts').insert({
        watch_id: watchId,
        check_in_id: newCheckIn.id,
        alert_type: sid ? 'sms_sent' : 'sms_failed',
        recipient_phone: updatedPhone,
        recipient_name: trimmedName,
        message: `[HANDOFF] Check-in SMS sent to new watcher ${trimmedName}`,
        delivery_status: sid ? 'sent' : 'failed',
        twilio_sid: sid,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Watcher reassigned from ${oldName} to ${trimmedName}`,
    })
  } catch (err) {
    console.error('Handoff error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
