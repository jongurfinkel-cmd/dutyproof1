import { formatInTimeZone } from 'date-fns-tz'

// Twilio SMS API via REST (no SDK dependency needed)

function getCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Missing Twilio credentials: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER must be set')
  }
  return { accountSid, authToken, fromNumber }
}

async function sendSMS(to: string, body: string): Promise<string | null> {
  try {
    const { accountSid, authToken, fromNumber } = getCredentials()
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const params = new URLSearchParams()
    params.append('To', to)
    params.append('From', fromNumber)
    params.append('Body', body)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Twilio SMS error:', res.status, err)
      return null
    }

    const data = await res.json()
    return data.sid ?? null // Twilio message SID for tracking
  } catch (err) {
    console.error('Twilio SMS error:', err)
    return null
  }
}

export async function sendCheckInSMS(
  to: string,
  facilityName: string,
  assignedName: string,
  checkInUrl: string,
  scheduledTime: Date,
  tz = 'America/New_York'
): Promise<string | null> {
  const timeStr = formatInTimeZone(scheduledTime, tz, 'h:mm a')
  return sendSMS(
    to,
    `DutyProof: ${assignedName}, your fire watch check-in at ${facilityName} is due at ${timeStr}. Tap to check in: ${checkInUrl} Reply STOP to opt out.`
  )
}

export async function sendAlertSMS(
  to: string,
  assignedName: string,
  facilityName: string,
  missedTime: Date,
  ackUrl?: string,
  tz = 'America/New_York'
): Promise<string | null> {
  const timeStr = formatInTimeZone(missedTime, tz, 'h:mm a')
  const message = ackUrl
    ? `DUTYPROOF ALERT: ${assignedName} missed their ${timeStr} check-in at ${facilityName}. Tap to acknowledge: ${ackUrl} Reply STOP to opt out.`
    : `DUTYPROOF ALERT: ${assignedName} missed their ${timeStr} check-in at ${facilityName}. Check your dashboard immediately. Reply STOP to opt out.`
  return sendSMS(to, message)
}

export async function sendWatchStartSMS(
  to: string,
  assignedName: string,
  facilityName: string,
  intervalMin: number
): Promise<string | null> {
  return sendSMS(
    to,
    `DutyProof: Fire watch started at ${facilityName}. ${assignedName} is assigned. Check-in required every ${intervalMin} minutes. You will receive SMS links for each check-in window. Reply STOP to opt out.`
  )
}

export async function sendWatchSummarySMS(
  to: string,
  facilityName: string,
  durationStr: string,
  totalRounds: number,
  completedRounds: number,
  missedRounds: number,
  reportUrl: string
): Promise<string | null> {
  const pct = totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0
  return sendSMS(
    to,
    `DutyProof Watch Complete. Job Site: ${facilityName}. Duration: ${durationStr}. Completed: ${completedRounds}/${totalRounds} (${pct}%). Missed: ${missedRounds}. Report: ${reportUrl} Reply STOP to opt out.`
  )
}

export async function sendOfflineAlertSMS(
  to: string,
  assignedName: string,
  facilityName: string
): Promise<string | null> {
  return sendSMS(
    to,
    `DutyProof: ${assignedName} appears to be offline at ${facilityName}. Their check-in app is running locally and will sync when connectivity returns. No action needed unless you cannot reach them. Reply STOP to opt out.`
  )
}

export async function sendOnlineResolvedSMS(
  to: string,
  assignedName: string,
  facilityName: string,
  synced: number,
  onTime: number,
  late: number
): Promise<string | null> {
  const lateNote = late > 0 ? `, ${late} late` : ''
  return sendSMS(
    to,
    `DutyProof: ${assignedName} is back online at ${facilityName}. ${synced} check-ins synced — ${onTime} on time${lateNote}. Reply STOP to opt out.`
  )
}

export async function sendStopWorkSMS(
  to: string,
  assignedName: string,
  facilityName: string,
  postWorkMin: number
): Promise<string | null> {
  return sendSMS(
    to,
    `DutyProof: Hot work completed at ${facilityName}. ${assignedName} has started the ${postWorkMin}-minute post-work monitoring period. Check-ins will continue until the cooldown period ends. Reply STOP to opt out.`
  )
}

export async function sendChecklistSMS(
  to: string,
  assignedName: string,
  facilityName: string,
  checklistUrl: string
): Promise<string | null> {
  return sendSMS(
    to,
    `DutyProof: ${assignedName}, before your fire watch begins at ${facilityName}, please complete the safety checklist: ${checklistUrl} Reply STOP to opt out.`
  )
}

// ── Double Opt-In Consent SMS ──
// First message sent to a watcher when SMS is enabled.
// Contains a link for the watcher to directly confirm consent.
// No operational SMS is sent until the watcher confirms.
export async function sendConsentSMS(
  to: string,
  assignedName: string,
  facilityName: string,
  consentUrl: string
): Promise<string | null> {
  return sendSMS(
    to,
    `DutyProof: ${assignedName}, your supervisor has assigned you to fire watch at ${facilityName}. To receive check-in reminders via text, confirm here: ${consentUrl}\n\nMsg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not required to use DutyProof.`
  )
}
