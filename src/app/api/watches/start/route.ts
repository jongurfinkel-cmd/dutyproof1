import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/tokens'
import { sendCheckInSMS, sendChecklistSMS } from '@/lib/twilio'
import { addMinutes } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      facility_id,
      location,
      reason,
      check_interval_min,
      assigned_name,
      assigned_phone,
      escalation_phone,
      escalation_delay_min,
      start_time,
      planned_end_time,
      checklist_items,
    } = body

    if (!facility_id || !check_interval_min || !assigned_name || !assigned_phone || !start_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate check_interval_min is a safe integer in allowed range
    if (!Number.isInteger(check_interval_min) || check_interval_min < 1 || check_interval_min > 1440) {
      return NextResponse.json({ error: 'Check interval must be 1–1440 minutes' }, { status: 400 })
    }

    // Validate escalation_delay_min if provided
    if (escalation_delay_min !== undefined && escalation_delay_min !== null) {
      if (!Number.isInteger(escalation_delay_min) || escalation_delay_min < 0 || escalation_delay_min > 60) {
        return NextResponse.json({ error: 'Escalation delay must be 0–60 minutes' }, { status: 400 })
      }
    }

    // Validate phone numbers are E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/
    if (!e164Regex.test(assigned_phone)) {
      return NextResponse.json({ error: 'assigned_phone must be E.164 format (e.g. +15551234567)' }, { status: 400 })
    }
    if (escalation_phone && !e164Regex.test(escalation_phone)) {
      return NextResponse.json({ error: 'escalation_phone must be E.164 format' }, { status: 400 })
    }

    // Validate assigned_name length
    const trimmedName = assigned_name.trim()
    if (!trimmedName || trimmedName.length > 100) {
      return NextResponse.json({ error: 'Name must be 1–100 characters' }, { status: 400 })
    }

    // Validate start_time is a valid date
    const startDate = new Date(start_time)
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start_time' }, { status: 400 })
    }

    // Validate planned_end_time if provided
    if (planned_end_time) {
      const endDate = new Date(planned_end_time)
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid planned_end_time' }, { status: 400 })
      }
    }

    // Validate checklist items if provided
    if (Array.isArray(checklist_items) && checklist_items.length > 0) {
      if (checklist_items.length > 50) {
        return NextResponse.json({ error: 'Checklist cannot exceed 50 items' }, { status: 400 })
      }
      for (const item of checklist_items) {
        if (typeof item.label !== 'string' || !item.label.trim() || item.label.length > 255) {
          return NextResponse.json({ error: 'Checklist item labels must be 1–255 characters' }, { status: 400 })
        }
      }
    }

    const admin = createAdminClient()

    // Verify facility belongs to this user
    const { data: facility, error: facilityError } = await admin
      .from('facilities')
      .select('*')
      .eq('id', facility_id)
      .eq('owner_id', user.id)
      .single()

    if (facilityError || !facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    // Generate checklist token if items provided
    const hasChecklist = Array.isArray(checklist_items) && checklist_items.length > 0
    const checklist_token = hasChecklist ? generateToken() : null

    // Display name used in SMS (includes wing/area when present)
    const displayName = location ? `${facility.name} — ${location}` : facility.name

    // Create the watch record
    const { data: watch, error: watchError } = await admin
      .from('watches')
      .insert({
        facility_id,
        location: location || null,
        reason: reason || null,
        check_interval_min,
        assigned_name,
        assigned_phone,
        escalation_phone: escalation_phone || null,
        escalation_delay_min: escalation_delay_min ?? 0,
        start_time,
        planned_end_time: planned_end_time || null,
        status: 'active',
        owner_id: user.id,
        checklist_token,
      })
      .select()
      .single()

    if (watchError || !watch) {
      console.error('Watch creation error:', watchError)
      return NextResponse.json({ error: 'Failed to create watch' }, { status: 500 })
    }

    // Insert checklist items if provided
    if (hasChecklist) {
      const items = checklist_items.map((item: { label: string; requires_photo: boolean }, i: number) => ({
        watch_id: watch.id,
        label: item.label,
        requires_photo: item.requires_photo ?? false,
        sort_order: i,
      }))
      const { error: itemsError } = await admin.from('watch_checklist_items').insert(items)
      if (itemsError) {
        console.error('Checklist items insert error:', itemsError)
        // Delete the watch we just created so the admin can retry cleanly
        await admin.from('watches').delete().eq('id', watch.id)
        return NextResponse.json({ error: 'Failed to create checklist. Please try again.' }, { status: 500 })
      }

      // Send immediate checklist SMS
      const checklistUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checklist/${checklist_token}`
      const checklistSid = await sendChecklistSMS(
        assigned_phone,
        assigned_name,
        displayName,
        checklistUrl
      )

      await admin.from('alerts').insert({
        watch_id: watch.id,
        alert_type: checklistSid ? 'sms_sent' : 'sms_failed',
        recipient_phone: assigned_phone,
        recipient_name: assigned_name,
        message: `Safety checklist SMS sent`,
        delivery_status: checklistSid ? 'sent' : 'failed',
        twilio_sid: checklistSid,
      })
    }

    // Create first check-in row
    // If there's a checklist, give the worker one full interval to complete it
    // before the first check-in is due
    const scheduledTime = hasChecklist
      ? addMinutes(new Date(start_time), check_interval_min)
      : new Date(start_time)
    const expiresAt = addMinutes(scheduledTime, check_interval_min)
    const token = generateToken()
    const checkInUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkin/${token}`

    const { data: checkIn, error: checkInError } = await admin
      .from('check_ins')
      .insert({
        watch_id: watch.id,
        scheduled_time: scheduledTime.toISOString(),
        token_expires_at: expiresAt.toISOString(),
        status: 'pending',
        token,
        assigned_name,
      })
      .select()
      .single()

    if (checkInError || !checkIn) {
      console.error('Check-in creation error:', checkInError)
      return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 })
    }

    // Send first check-in SMS
    const twilioSid = await sendCheckInSMS(
      assigned_phone,
      displayName,
      assigned_name,
      checkInUrl,
      scheduledTime,
      facility.timezone
    )

    // Log alert
    await admin.from('alerts').insert({
      watch_id: watch.id,
      check_in_id: checkIn.id,
      alert_type: twilioSid ? 'sms_sent' : 'sms_failed',
      recipient_phone: assigned_phone,
      recipient_name: assigned_name,
      message: `Check-in SMS for ${scheduledTime.toISOString()}`,
      delivery_status: twilioSid ? 'sent' : 'failed',
      twilio_sid: twilioSid,
    })

    if (!twilioSid) {
      await admin.from('alerts').insert({
        watch_id: watch.id,
        alert_type: 'sms_failed',
        recipient_phone: assigned_phone,
        recipient_name: assigned_name,
        message: `FAILED to send first check-in SMS to ${assigned_name}`,
        delivery_status: 'failed',
      })
    }

    // Log watch_started alert
    await admin.from('alerts').insert({
      watch_id: watch.id,
      alert_type: 'watch_started',
      message: `Watch started at ${displayName}`,
    })

    return NextResponse.json({ watchId: watch.id, smsDelivered: !!twilioSid })
  } catch (err) {
    console.error('Start watch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
