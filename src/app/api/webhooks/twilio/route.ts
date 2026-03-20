import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Sinch delivery report webhook
// Configure the callback URL in your Sinch dashboard to point here.
// Sinch sends JSON (not form-encoded like Twilio).

export async function POST(req: NextRequest) {
  // Verify the webhook is from Sinch using a shared secret header
  const webhookSecret = process.env.SINCH_WEBHOOK_SECRET
  if (webhookSecret) {
    const provided = req.headers.get('x-sinch-webhook-secret') ?? ''
    if (provided !== webhookSecret) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  } else {
    console.warn('SINCH_WEBHOOK_SECRET not configured — accepting all webhooks')
  }

  let body: { statuses?: Array<{ id: string; status: string; code?: number }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.statuses || !Array.isArray(body.statuses)) {
    return NextResponse.json({ ok: true })
  }

  const admin = createAdminClient()

  for (const entry of body.statuses) {
    const batchId = entry.id
    const status = entry.status // Delivered, Failed, Expired, Rejected, etc.

    if (!batchId) continue

    const deliveryStatus =
      status === 'Delivered'                                        ? 'delivered' :
      status === 'Failed' || status === 'Rejected' || status === 'Expired' ? 'failed'    :
                                                                      'sent'

    const { error: updateError } = await admin
      .from('alerts')
      .update({ delivery_status: deliveryStatus })
      .eq('twilio_sid', batchId) // column stores Sinch batch ID now

    if (updateError) {
      console.error('Failed to update alert delivery status:', updateError)
    }

    // If delivery failed, log a visible alert
    if (deliveryStatus === 'failed') {
      const { data: alert, error: fetchError } = await admin
        .from('alerts')
        .select('watch_id, recipient_name, recipient_phone')
        .eq('twilio_sid', batchId)
        .single()

      if (fetchError) {
        console.error('Failed to fetch alert by batch ID:', fetchError)
      } else if (alert) {
        const { error: insertError } = await admin.from('alerts').insert({
          watch_id:        alert.watch_id,
          alert_type:      'sms_failed',
          recipient_phone: alert.recipient_phone,
          recipient_name:  alert.recipient_name,
          message:         `SMS delivery FAILED (status: ${status}). Batch: ${batchId}`,
          delivery_status: 'failed',
          twilio_sid:      batchId,
        })
        if (insertError) {
          console.error('Failed to insert SMS failure alert:', insertError)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
