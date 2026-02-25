import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateTwilioSignature } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-twilio-signature') ?? ''

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    console.error('Missing NEXT_PUBLIC_APP_URL for Twilio webhook validation')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const url = `${appUrl}/api/webhooks/twilio`

  // Parse form-encoded body
  const params: Record<string, string> = {}
  new URLSearchParams(body).forEach((value, key) => {
    params[key] = value
  })

  // Validate Twilio signature in production
  if (process.env.NODE_ENV === 'production') {
    const valid = validateTwilioSignature(signature, url, params)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  }

  const messageSid    = params.MessageSid
  const messageStatus = params.MessageStatus // sent, delivered, undelivered, failed

  if (!messageSid) {
    return NextResponse.json({ ok: true })
  }

  const admin = createAdminClient()

  const deliveryStatus =
    messageStatus === 'delivered'                                  ? 'delivered' :
    messageStatus === 'failed' || messageStatus === 'undelivered' ? 'failed'    :
                                                                    'sent'

  const { error: updateError } = await admin
    .from('alerts')
    .update({ delivery_status: deliveryStatus })
    .eq('twilio_sid', messageSid)

  if (updateError) {
    console.error('Failed to update alert delivery status:', updateError)
  }

  // If delivery failed, log a visible alert
  if (deliveryStatus === 'failed') {
    const { data: alert, error: fetchError } = await admin
      .from('alerts')
      .select('watch_id, recipient_name, recipient_phone')
      .eq('twilio_sid', messageSid)
      .single()

    if (fetchError) {
      console.error('Failed to fetch alert by twilio_sid:', fetchError)
    } else if (alert) {
      const { error: insertError } = await admin.from('alerts').insert({
        watch_id:       alert.watch_id,
        alert_type:     'sms_failed',
        recipient_phone: alert.recipient_phone,
        recipient_name:  alert.recipient_name,
        message:         `SMS delivery FAILED (status: ${messageStatus}). SID: ${messageSid}`,
        delivery_status: 'failed',
        twilio_sid:      messageSid,
      })
      if (insertError) {
        console.error('Failed to insert SMS failure alert:', insertError)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
