import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit } from '@/lib/rate-limit'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per 10 minutes per IP
  const limited = rateLimit(req, { limit: 5, windowSec: 600, prefix: 'support' })
  if (limited) return limited

  let body: { name?: string; email?: string; topic?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { name, email, topic, message } = body

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
  }

  // Length limits to prevent abuse
  if (name.trim().length > 200) return NextResponse.json({ error: 'Name too long.' }, { status: 400 })
  if (email.trim().length > 320) return NextResponse.json({ error: 'Email too long.' }, { status: 400 })
  if ((topic?.trim().length ?? 0) > 200) return NextResponse.json({ error: 'Topic too long.' }, { status: 400 })
  if (message.trim().length > 5000) return NextResponse.json({ error: 'Message too long.' }, { status: 400 })

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  try {
    await getResend().emails.send({
      from: 'DutyProof <noreply@dutyproof.com>',
      to: 'jon@dutyproof.com',
      replyTo: email.trim(),
      subject: `Support request from ${name.trim()}${topic?.trim() ? ` — ${topic.trim()}` : ''}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px;">
          <h2 style="color: #1e293b; margin-bottom: 20px;">New support request</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; width: 100px;">Name</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${escapeHtml(name.trim())}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;"><a href="mailto:${escapeHtml(email.trim())}" style="color: #2563eb;">${escapeHtml(email.trim())}</a></td>
            </tr>
            ${topic?.trim() ? `<tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Topic</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${escapeHtml(topic.trim())}</td>
            </tr>` : ''}
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">Message</p>
            <p style="color: #1e293b; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(message.trim())}</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Reply directly to this email to respond to ${escapeHtml(name.trim())}.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Support email failed:', err)
    return NextResponse.json({ error: 'Failed to send request. Please try again.' }, { status: 500 })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
