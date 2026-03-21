import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { generateToken } from '@/lib/tokens'
import { sendCheckInSMS, sendChecklistSMS, sendConsentSMS } from '@/lib/sms'
import { addMinutes } from 'date-fns'

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowSec: 60, prefix: 'watch-start' })
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify active subscription before allowing watch creation
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, is_admin')
      .eq('id', user.id)
      .single()

    const activeStatuses = ['trialing', 'active']
    const hasAccess = profile?.is_admin || activeStatuses.includes(profile?.subscription_status ?? '')
    if (!profile || !hasAccess) {
      return NextResponse.json({ error: 'Active subscription required to start a watch' }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const {
      facility_id,
      location,
      reason,
      check_interval_min,
      assigned_name,
      assigned_phone,
      sms_enabled,
      escalation_phone,
      escalation_delay_min,
      start_time,
      planned_end_time,
      checklist_items,
      watch_type,
      permit_number,
      permit_photo_url,
      post_work_duration_min,
      secondary_escalation_phone,
      watch_latitude,
      watch_longitude,
      watch_radius_m,
    } = body

    if (!facility_id || !check_interval_min || !assigned_name || !start_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Phone is required only when SMS is enabled
    if (sms_enabled && !assigned_phone) {
      return NextResponse.json({ error: 'Phone number is required when SMS is enabled' }, { status: 400 })
    }

    // Supervisor escalation phone is always required
    if (!escalation_phone) {
      return NextResponse.json({ error: 'Supervisor phone number is required for missed check-in alerts' }, { status: 400 })
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

    // Validate phone numbers are E.164 format (only when provided)
    const e164Regex = /^\+[1-9]\d{1,14}$/
    if (assigned_phone && !e164Regex.test(assigned_phone)) {
      return NextResponse.json({ error: 'assigned_phone must be E.164 format (e.g. +12125551234)' }, { status: 400 })
    }
    if (escalation_phone && !e164Regex.test(escalation_phone)) {
      return NextResponse.json({ error: 'escalation_phone must be E.164 format' }, { status: 400 })
    }
    if (secondary_escalation_phone && !e164Regex.test(secondary_escalation_phone)) {
      return NextResponse.json({ error: 'secondary_escalation_phone must be E.164 format' }, { status: 400 })
    }

    // Validate watch_type if provided
    if (watch_type !== undefined && watch_type !== 'hot_work' && watch_type !== 'impairment') {
      return NextResponse.json({ error: 'watch_type must be "hot_work" or "impairment"' }, { status: 400 })
    }

    // Validate permit_number length
    if (permit_number !== undefined && permit_number !== null) {
      if (typeof permit_number !== 'string' || permit_number.length > 100) {
        return NextResponse.json({ error: 'permit_number must be 1–100 characters' }, { status: 400 })
      }
    }

    // Validate post_work_duration_min if provided
    if (post_work_duration_min !== undefined && post_work_duration_min !== null) {
      if (!Number.isInteger(post_work_duration_min) || post_work_duration_min < 0 || post_work_duration_min > 480) {
        return NextResponse.json({ error: 'post_work_duration_min must be an integer 0–480' }, { status: 400 })
      }
    }

    // Validate geofence fields
    if (watch_latitude !== undefined && watch_latitude !== null) {
      if (typeof watch_latitude !== 'number' || watch_latitude < -90 || watch_latitude > 90) {
        return NextResponse.json({ error: 'watch_latitude must be between -90 and 90' }, { status: 400 })
      }
    }
    if (watch_longitude !== undefined && watch_longitude !== null) {
      if (typeof watch_longitude !== 'number' || watch_longitude < -180 || watch_longitude > 180) {
        return NextResponse.json({ error: 'watch_longitude must be between -180 and 180' }, { status: 400 })
      }
    }
    if ((watch_latitude != null) !== (watch_longitude != null)) {
      return NextResponse.json({ error: 'watch_latitude and watch_longitude must both be provided or both be null' }, { status: 400 })
    }
    if (watch_radius_m !== undefined && watch_radius_m !== null) {
      if (!Number.isInteger(watch_radius_m) || watch_radius_m < 10 || watch_radius_m > 5000) {
        return NextResponse.json({ error: 'watch_radius_m must be an integer between 10 and 5000' }, { status: 400 })
      }
    }

    // Validate location and reason length
    if (location && (typeof location !== 'string' || location.length > 255)) {
      return NextResponse.json({ error: 'Location must be 1–255 characters' }, { status: 400 })
    }
    if (reason && (typeof reason !== 'string' || reason.length > 1000)) {
      return NextResponse.json({ error: 'Reason must be 1–1000 characters' }, { status: 400 })
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
      if (endDate <= startDate) {
        return NextResponse.json({ error: 'Planned end time must be after start time' }, { status: 400 })
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('Missing NEXT_PUBLIC_APP_URL')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
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

    // Generate a persistent session token for the watch (one link for the entire watch)
    const session_token = generateToken()

    // Generate SMS consent token for double opt-in (if SMS enabled)
    const sms_consent_token = sms_enabled ? generateToken() : null

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
        watch_type: watch_type || 'hot_work',
        permit_number: permit_number || null,
        permit_photo_url: permit_photo_url || null,
        post_work_duration_min: post_work_duration_min ?? 30,
        secondary_escalation_phone: secondary_escalation_phone || null,
        watch_latitude: watch_latitude ?? null,
        watch_longitude: watch_longitude ?? null,
        ...(watch_radius_m !== undefined && watch_radius_m !== null ? { watch_radius_m } : {}),
        session_token,
        sms_consent_token,
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

      // Checklist SMS will be sent AFTER watcher confirms SMS consent (handled by /api/sms/confirm)
    }

    // Create first check-in row
    // If there's a checklist, give the worker one full interval to complete it
    // before the first check-in is due
    const scheduledTime = hasChecklist
      ? addMinutes(new Date(start_time), check_interval_min)
      : new Date(start_time)
    const expiresAt = addMinutes(scheduledTime, check_interval_min)
    const token = generateToken()
    // Use session_token for the link — one persistent URL for the whole watch
    const checkInUrl = `${appUrl}/checkin/${session_token}`

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

    // Send SMS: either consent request (double opt-in) or direct check-in
    let twilioSid: string | null = null
    if (sms_enabled && assigned_phone && sms_consent_token) {
      // Double opt-in: send consent SMS first. Operational SMS starts only after watcher confirms.
      const consentUrl = `${appUrl}/sms-confirm/${sms_consent_token}`
      twilioSid = await sendConsentSMS(
        assigned_phone,
        assigned_name,
        displayName,
        consentUrl
      )

      // Log alert
      const { error: consentAlertErr } = await admin.from('alerts').insert({
        watch_id: watch.id,
        alert_type: twilioSid ? 'sms_sent' : 'sms_failed',
        recipient_phone: assigned_phone,
        recipient_name: assigned_name,
        message: `SMS consent request sent (double opt-in)`,
        delivery_status: twilioSid ? 'sent' : 'failed',
        twilio_sid: twilioSid,
      })
      if (consentAlertErr) console.error('Failed to log consent SMS alert:', consentAlertErr)
    }

    // Log watch_started alert
    const { error: startAlertErr } = await admin.from('alerts').insert({
      watch_id: watch.id,
      alert_type: 'watch_started',
      message: `Watch started at ${displayName}${sms_enabled ? '' : ' (manual mode — no SMS)'}`,
    })
    if (startAlertErr) console.error('Failed to log watch_started alert:', startAlertErr)

    return NextResponse.json({ watchId: watch.id, smsDelivered: !!twilioSid, sessionToken: session_token })
  } catch (err) {
    console.error('Start watch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
