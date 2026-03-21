import { format } from 'date-fns'

// Sinch SMS API via REST (no SDK dependency needed)

function getCredentials() {
  const servicePlanId = process.env.SINCH_SERVICE_PLAN_ID
  const apiToken = process.env.SINCH_API_TOKEN
  const fromNumber = process.env.SINCH_PHONE_NUMBER
  if (!servicePlanId || !apiToken || !fromNumber) {
    throw new Error('Missing Sinch credentials: SINCH_SERVICE_PLAN_ID, SINCH_API_TOKEN, and SINCH_PHONE_NUMBER must be set')
  }
  return { servicePlanId, apiToken, fromNumber }
}

async function sendSMS(to: string, body: string): Promise<string | null> {
  try {
    const { servicePlanId, apiToken, fromNumber } = getCredentials()
    const region = process.env.SINCH_REGION || 'us'
    const url = `https://${region}.sms.api.sinch.com/xms/v1/${servicePlanId}/batches`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromNumber,
        to: [to],
        body,
        type: 'mt_text',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Sinch SMS error:', res.status, err)
      return null
    }

    const data = await res.json()
    return data.id ?? null // batch ID used for tracking
  } catch (err) {
    console.error('Sinch SMS error:', err)
    return null
  }
}

export async function sendCheckInSMS(
  to: string,
  facilityName: string,
  assignedName: string,
  checkInUrl: string,
  scheduledTime: Date
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
  missedTime: Date,
  ackUrl?: string
): Promise<string | null> {
  const timeStr = format(missedTime, 'h:mm a')
  const message = ackUrl
    ? `DUTYPROOF ALERT: ${assignedName} missed their ${timeStr} check-in at ${facilityName}. Tap to acknowledge: ${ackUrl}`
    : `DUTYPROOF ALERT: ${assignedName} missed their ${timeStr} check-in at ${facilityName}. Check your dashboard immediately.`
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
    `DutyProof Watch Complete\nJob Site: ${facilityName}\nDuration: ${durationStr}\nCompleted: ${completedRounds}/${totalRounds} (${pct}%)\nMissed: ${missedRounds}\nReport: ${reportUrl}`
  )
}

export async function sendOfflineAlertSMS(
  to: string,
  assignedName: string,
  facilityName: string
): Promise<string | null> {
  return sendSMS(
    to,
    `DutyProof: ${assignedName} appears to be offline at ${facilityName}. Their check-in app is running locally and will sync when connectivity returns. No action needed unless you cannot reach them.`
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
    `DutyProof: ${assignedName} is back online at ${facilityName}. ${synced} check-ins synced — ${onTime} on time${lateNote}.`
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
    `DutyProof: Hot work completed at ${facilityName}. ${assignedName} has started the ${postWorkMin}-minute post-work monitoring period. Check-ins will continue until the cooldown period ends.`
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
