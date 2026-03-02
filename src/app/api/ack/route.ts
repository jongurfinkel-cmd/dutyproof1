import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 20, windowSec: 60, prefix: 'ack' })
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { token, latitude, longitude, gps_accuracy } = body

  if (!token || typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  if (latitude != null && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
    return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
  }
  if (longitude != null && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
    return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
  }
  if (gps_accuracy != null && (typeof gps_accuracy !== 'number' || gps_accuracy < 0)) {
    return NextResponse.json({ error: 'Invalid GPS accuracy' }, { status: 400 })
  }

  const admin = createAdminClient()
  const serverTime = new Date().toISOString()

  const { data: checkIn, error: findError } = await admin
    .from('check_ins')
    .select('*, watches(id, escalation_phone)')
    .eq('ack_token', token)
    .single()

  if (findError || !checkIn) {
    return NextResponse.json({ error: 'Invalid acknowledgment link' }, { status: 404 })
  }

  if (checkIn.ack_at) {
    return NextResponse.json({ error: 'This alert has already been acknowledged.' }, { status: 409 })
  }

  const { error: ackError } = await admin.rpc('acknowledge_checkin', {
    p_checkin_id: checkIn.id,
    p_ack_at: serverTime,
    p_latitude: (latitude as number) ?? null,
    p_longitude: (longitude as number) ?? null,
    p_gps_accuracy: (gps_accuracy as number) ?? null,
  })

  if (ackError) {
    // Supabase wraps RAISE EXCEPTION as code P0001 — means already ack'd or invalid state
    if (ackError.code === 'P0001') {
      return NextResponse.json({ error: 'This alert cannot be acknowledged.' }, { status: 409 })
    }
    console.error('acknowledge_checkin RPC error:', ackError)
    return NextResponse.json({ error: 'Failed to record acknowledgment' }, { status: 500 })
  }

  // Log acknowledgment in audit trail
  await admin.from('alerts').insert({
    watch_id: checkIn.watches.id,
    check_in_id: checkIn.id,
    alert_type: 'escalation_acknowledged',
    recipient_phone: checkIn.watches.escalation_phone,
    recipient_name: 'Supervisor',
    message: `Supervisor acknowledged missed check-in at ${checkIn.scheduled_time}`,
    delivery_status: null,
    twilio_sid: null,
  })

  return NextResponse.json({ success: true, serverTime })
}
