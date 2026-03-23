import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

const FROM = 'DutyProof Alerts <alerts@dutyproof.com>'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Send missed check-in escalation email to account owner */
export async function sendEscalationEmail(
  to: string,
  watcherName: string,
  siteName: string,
  scheduledTime: Date,
  watchUrl: string
): Promise<string | null> {
  try {
    const resend = getResend()
    const timeStr = scheduledTime.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Missed check-in: ${watcherName} at ${siteName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #991b1b;">Missed Check-In Alert</p>
            <p style="margin: 0; font-size: 13px; color: #b91c1c;">
              <strong>${esc(watcherName)}</strong> missed their scheduled check-in at <strong>${esc(siteName)}</strong>.
            </p>
          </div>
          <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; width: 110px;">Scheduled</td>
              <td style="padding: 8px 0;">${esc(timeStr)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Fire Watcher</td>
              <td style="padding: 8px 0;">${esc(watcherName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Job Site</td>
              <td style="padding: 8px 0;">${esc(siteName)}</td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <a href="${esc(watchUrl)}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 8px;">
              View Watch Details
            </a>
          </div>
          <p style="margin-top: 24px; font-size: 11px; color: #94a3b8;">
            This alert was sent because no supervisor SMS escalation phone was configured for this watch.
            To receive faster alerts via text message, enable SMS Supervisor Escalation when creating a watch.
          </p>
        </div>
      `,
    })
    if (error) {
      console.error('Escalation email error:', error)
      return null
    }
    return data?.id ?? null
  } catch (err) {
    console.error('Escalation email error:', err)
    return null
  }
}

/** Send offline watcher alert email */
export async function sendOfflineAlertEmail(
  to: string,
  watcherName: string,
  siteName: string,
  watchUrl: string
): Promise<string | null> {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Watcher offline: ${watcherName} at ${siteName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #92400e;">Watcher Appears Offline</p>
            <p style="margin: 0; font-size: 13px; color: #a16207;">
              <strong>${esc(watcherName)}</strong> appears to have lost connectivity at <strong>${esc(siteName)}</strong>.
              Check-ins will resume automatically when they reconnect.
            </p>
          </div>
          <div style="margin-top: 20px;">
            <a href="${esc(watchUrl)}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 8px;">
              View Watch Details
            </a>
          </div>
          <p style="margin-top: 24px; font-size: 11px; color: #94a3b8;">
            This is a one-time notification. You will not receive further offline alerts for this watch unless the watcher reconnects and misses again.
          </p>
        </div>
      `,
    })
    if (error) {
      console.error('Offline alert email error:', error)
      return null
    }
    return data?.id ?? null
  } catch (err) {
    console.error('Offline alert email error:', err)
    return null
  }
}

/** Send watch auto-ended summary email */
export async function sendWatchSummaryEmail(
  to: string,
  siteName: string,
  duration: string,
  total: number,
  completed: number,
  missed: number,
  reportUrl: string
): Promise<string | null> {
  try {
    const resend = getResend()
    const pct = total > 0 ? Math.round((completed / total) * 100) : 100
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Watch complete: ${siteName} — ${pct}% compliance`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <div style="background: ${pct === 100 ? '#f0fdf4' : '#fffbeb'}; border: 1px solid ${pct === 100 ? '#bbf7d0' : '#fde68a'}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: ${pct === 100 ? '#166534' : '#92400e'};">Watch Completed</p>
            <p style="margin: 0; font-size: 13px; color: #475569;">
              <strong>${esc(siteName)}</strong> — ${esc(duration)}
            </p>
          </div>
          <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; width: 110px;">Compliance</td>
              <td style="padding: 8px 0; font-weight: 700; color: ${pct === 100 ? '#16a34a' : pct >= 80 ? '#d97706' : '#dc2626'};">${pct}%</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Check-ins</td>
              <td style="padding: 8px 0;">${completed} completed, ${missed} missed (${total} total)</td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <a href="${esc(reportUrl)}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 8px;">
              View Report
            </a>
          </div>
        </div>
      `,
    })
    if (error) {
      console.error('Watch summary email error:', error)
      return null
    }
    return data?.id ?? null
  } catch (err) {
    console.error('Watch summary email error:', err)
    return null
  }
}
