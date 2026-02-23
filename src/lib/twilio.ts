import twilio from 'twilio'
import { format } from 'date-fns'

const accountSid = process.env.TWILIO_ACCOUNT_SID ?? ''
const authToken  = process.env.TWILIO_AUTH_TOKEN ?? ''
const fromNumber = process.env.TWILIO_PHONE_NUMBER ?? ''

function getClient() {
  return twilio(accountSid, authToken)
}

async function sendSMS(to: string, body: string): Promise<string | null> {
  try {
    const message = await getClient().messages.create({
      from: fromNumber,
      to,
      body,
    })
    return message.sid
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
  _timezone: string
): Promise<string | null> {
  const timeStr = format(scheduledTime, 'h:mm a')
  return sendSMS(
    to,
    `DutyProof: ${assignedName}, your fire watch check-in at ${facilityName} is due at ${timeStr}. Tap to check in: ${checkInUrl}`
  )
}

export async function sendAlertSMS(
  to: string,
  assignedName: string,
  facilityName: string,
  missedTime: Date
): Promise<string | null> {
  const timeStr = format(missedTime, 'h:mm a')
  return sendSMS(
    to,
    `DUTYPROOF ALERT: ${assignedName} missed their ${timeStr} check-in at ${facilityName}. Check your dashboard immediately.`
  )
}

export async function sendWatchStartSMS(
  to: string,
  assignedName: string,
  facilityName: string,
  intervalMin: number
): Promise<string | null> {
  return sendSMS(
    to,
    `DutyProof: Fire watch started at ${facilityName}. ${assignedName} is assigned. Check-in required every ${intervalMin} minutes. You will receive SMS links for each check-in window.`
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
    `DutyProof Watch Complete\nFacility: ${facilityName}\nDuration: ${durationStr}\nCompleted: ${completedRounds}/${totalRounds} (${pct}%)\nMissed: ${missedRounds}\nReport: ${reportUrl}`
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
    `DutyProof: ${assignedName}, before your fire watch begins at ${facilityName}, please complete the safety checklist: ${checklistUrl}`
  )
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken) return false
  return twilio.validateRequest(authToken, signature, url, params)
}
