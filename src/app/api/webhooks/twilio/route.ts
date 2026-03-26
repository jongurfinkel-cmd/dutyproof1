import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Twilio SMS status callback webhook
// Configure StatusCallback URL in Twilio console or pass when sending messages.
// Twilio sends form-encoded POST with MessageSid, MessageStatus, etc.

function validateTwilioSignature(req: NextRequest, body: string): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured — cannot validate webhook')
    return false
  }

  const signature = req.headers.get('x-twilio-signature') ?? ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`

  // Parse form params and sort alphabetically
  const params = new URLSearchParams(body)
  const sortedKeys = Array.from(params.keys()).sort()
  let dataString = url
  for (const key of sortedKeys) {
    dataString += key + params.get(key)
  }

  const expected = crypto
    .createHmac('sha1', authToken)
    .update(dataString)
    .digest('base64')

  return signature === expected
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  if (!validateTwilioSignature(req, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const params = new URLSearchParams(body)
  const messageSid = params.get('MessageSid')
  const messageStatus = params.get('MessageStatus')

  if (!messageSid || !messageStatus) {
    return NextResponse.json({ ok: true })
  }

  // Map Twilio statuses to our delivery_status values
  const deliveryStatus =
    messageStatus === 'delivered'                                      ? 'delivered' :
    messageStatus === 'failed' || messageStatus === 'undelivered'      ? 'failed'    :
    messageStatus === 'sent' || messageStatus === 'queued'             ? 'sent'      :
                                                                         'sent'

  const admin = createAdminClient()

  const { error: updateError } = await admin
    .from('alerts')
    .update({ delivery_status: deliveryStatus })
    .eq('twilio_sid', messageSid)

  if (updateError) {
    console.error('Failed to update alert delivery status:', updateError)
  }

  // If delivery failed, log a visible alert
  if (deliveryStatus === 'failed') {
    const errorCode = params.get('ErrorCode') ?? 'unknown'

    const { data: alert, error: fetchError } = await admin
      .from('alerts')
      .select('watch_id, recipient_name, recipient_phone')
      .eq('twilio_sid', messageSid)
      .single()

    if (fetchError) {
      console.error('Failed to fetch alert by message SID:', fetchError)
    } else if (alert) {
      const { error: insertError } = await admin.from('alerts').insert({
        watch_id:        alert.watch_id,
        alert_type:      'sms_failed',
        recipient_phone: alert.recipient_phone,
        recipient_name:  alert.recipient_name,
        message:         `SMS delivery FAILED (status: ${messageStatus}, error: ${errorCode}). SID: ${messageSid}`,
        delivery_status: 'failed',
        twilio_sid:      messageSid,
      })
      if (insertError) {
        console.error('Failed to insert SMS failure alert:', insertError)
      }
    }
  }

  // Twilio expects 200 with empty body or TwiML
  return new NextResponse('<Response/>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
