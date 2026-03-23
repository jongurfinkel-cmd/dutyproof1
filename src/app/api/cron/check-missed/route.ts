import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateToken } from '@/lib/tokens'
import { sendCheckInSMS, sendAlertSMS, sendWatchSummarySMS, sendOfflineAlertSMS } from '@/lib/sms'
import { sendEscalationEmail, sendOfflineAlertEmail, sendWatchSummaryEmail } from '@/lib/email'
import { addMinutes, formatDuration, intervalToDuration } from 'date-fns'

export async function GET(req: NextRequest) {
  // Protect with cron secret — accepts Authorization: Bearer header (Vercel cron)
  // or x-cron-secret header. Query params NOT accepted (they leak in logs/proxies).
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const secret = bearerToken || req.headers.get('x-cron-secret')

  // Always require secret in production; allow unauthenticated in local dev only
  if (process.env.NODE_ENV === 'production' && !process.env.CRON_SECRET) {
    console.error('CRON_SECRET is not configured in production')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  if (process.env.CRON_SECRET) {
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    console.error('Missing NEXT_PUBLIC_APP_URL')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  let missedCount = 0
  const errors: string[] = []
  const pushError = (msg: string) => { if (errors.length < 100) errors.push(msg) }

  // Cache owner emails to avoid repeated lookups
  const ownerEmailCache: Record<string, string | null> = {}
  async function getOwnerEmail(ownerId: string): Promise<string | null> {
    if (ownerId in ownerEmailCache) return ownerEmailCache[ownerId]
    const { data } = await admin.auth.admin.getUserById(ownerId)
    const email = data?.user?.email ?? null
    ownerEmailCache[ownerId] = email
    return email
  }

  try {
    // ── Auto-stop pass ────────────────────────────────────────────────────
    // End active watches whose planned_end_time has passed.
    const { data: expiredWatches } = await admin
      .from('watches')
      .select('*, facilities(*)')
      .eq('status', 'active')
      .not('planned_end_time', 'is', null)
      .lt('planned_end_time', now)

    for (const watch of expiredWatches ?? []) {
      try {
        // If work has been stopped and there's a post-work cooldown period,
        // don't auto-end until the cooldown finishes.
        if (watch.work_stopped_at && watch.post_work_duration_min > 0) {
          const postWorkEnd = new Date(watch.work_stopped_at)
          postWorkEnd.setMinutes(postWorkEnd.getMinutes() + watch.post_work_duration_min)
          if (new Date() < postWorkEnd) continue // cooldown still active — skip
        }

        const { error: endErr } = await admin
          .from('watches')
          .update({ status: 'completed', ended_at: now })
          .eq('id', watch.id)
        if (endErr) {
          pushError(`Failed to auto-end watch ${watch.id}: ${endErr.message}`)
          continue
        }

        const { error: cancelErr } = await admin.rpc('cancel_watch_checkins', { p_watch_id: watch.id })
        if (cancelErr) pushError(`Failed to cancel check-ins for auto-ended watch ${watch.id}: ${cancelErr.message}`)

        // Send summary SMS
        const { data: checkIns } = await admin
          .from('check_ins')
          .select('status')
          .eq('watch_id', watch.id)

        const completed = (checkIns ?? []).filter((c) => c.status === 'completed').length
        const missed = (checkIns ?? []).filter((c) => c.status === 'missed').length
        const total = completed + missed
        const duration = intervalToDuration({ start: new Date(watch.start_time), end: new Date(now) })
        const durationStr = formatDuration(duration, { format: ['hours', 'minutes'] }) || 'Less than a minute'
        const reportUrl = `${appUrl}/watches/${watch.id}`
        const facility = watch.facilities

        // Only send summary SMS if the watch has a phone number (SMS-enabled) and watcher consented
        if (watch.assigned_phone && watch.sms_consent_confirmed_at) {
          await sendWatchSummarySMS(watch.assigned_phone, facility.name, durationStr, total, completed, missed, reportUrl)
        }
        if (watch.escalation_phone && watch.escalation_phone !== watch.assigned_phone) {
          await sendWatchSummarySMS(watch.escalation_phone, facility.name, durationStr, total, completed, missed, reportUrl)
        } else if (!watch.escalation_phone) {
          // No SMS escalation — send summary email to account owner
          const ownerEmail = await getOwnerEmail(watch.owner_id)
          if (ownerEmail) {
            await sendWatchSummaryEmail(ownerEmail, facility.name, durationStr, total, completed, missed, reportUrl)
          }
        }

        const { error: alertErr } = await admin.from('alerts').insert({
          watch_id: watch.id,
          alert_type: 'watch_ended',
          message: `Watch auto-ended (planned end time reached). ${completed}/${total} check-ins completed.`,
        })
        if (alertErr) pushError(`Failed to log auto-end alert for ${watch.id}: ${alertErr.message}`)
      } catch (innerErr) {
        pushError(`Auto-stop error for watch ${watch.id}: ${String(innerErr)}`)
      }
    }

    // Find expired pending check-ins for active watches
    const { data: expiredCheckIns, error: fetchError } = await admin
      .from('check_ins')
      .select('*, watches(*, facilities(*))')
      .eq('status', 'pending')
      .lt('token_expires_at', now)

    if (fetchError) {
      console.error('Cron fetch error:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    for (const checkIn of expiredCheckIns ?? []) {
      const watch = checkIn.watches
      if (!watch || watch.status !== 'active') continue

      const facility = watch.facilities
      const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name

      try {
        // Mark as missed via DB function
        const { error: missError } = await admin.rpc('mark_checkin_missed', {
          p_checkin_id: checkIn.id,
        })

        if (missError) {
          pushError(`Failed to mark ${checkIn.id} as missed: ${missError.message}`)
          continue
        }

        missedCount++

        // Increment consecutive misses and flag compliance gap
        const newConsecutive = (watch.consecutive_misses ?? 0) + 1
        const updateData: Record<string, unknown> = { consecutive_misses: newConsecutive }
        if (newConsecutive >= 2) {
          updateData.compliance_status = watch.session_token ? 'offline_suspected' : 'gap_detected'
        }
        const { error: missCountErr } = await admin
          .from('watches')
          .update(updateData)
          .eq('id', watch.id)
        if (missCountErr) pushError(`Failed to update miss count for watch ${watch.id}: ${missCountErr.message}`)

        // ── Session-token watches: determine if watcher is offline or genuinely missed ──
        if (watch.session_token && (watch.escalation_phone || watch.owner_id)) {
          // Check if the watcher has synced recently (within 5 minutes)
          // If yes → they're online and genuinely missed → escalate normally
          // If no → they're likely offline → send one-time offline alert
          const syncGraceMs = 5 * 60 * 1000
          const lastSync = watch.last_sync_at ? new Date(watch.last_sync_at).getTime() : 0
          const isRecentlyOnline = lastSync > 0 && (Date.now() - lastSync) < syncGraceMs

          if (isRecentlyOnline) {
            // Watcher is ONLINE but genuinely missed — escalate
            if (watch.escalation_phone) {
              const ackToken = generateToken()
              const ackUrl = `${appUrl}/ack/${ackToken}`

              const alertSid = await sendAlertSMS(
                watch.escalation_phone,
                checkIn.assigned_name,
                displayName,
                new Date(checkIn.scheduled_time),
                ackUrl
              )

              const { error: escAlertErr } = await admin.from('alerts').insert({
                watch_id: watch.id,
                check_in_id: checkIn.id,
                alert_type: 'missed_checkin',
                recipient_phone: watch.escalation_phone,
                recipient_name: 'Supervisor',
                message: `${checkIn.assigned_name} missed check-in at ${checkIn.scheduled_time} (watcher is online)`,
                delivery_status: alertSid ? 'sent' : 'failed',
                twilio_sid: alertSid,
              })
              if (escAlertErr) pushError(`Failed to log escalation alert for ${checkIn.id}: ${escAlertErr.message}`)

              if (alertSid) {
                const { error: escUpdateErr } = await admin.rpc('escalate_checkin', {
                  p_checkin_id: checkIn.id,
                  p_escalation_sent_at: new Date().toISOString(),
                  p_ack_token: ackToken,
                })
                if (escUpdateErr) pushError(`Failed to mark escalation sent for ${checkIn.id}: ${escUpdateErr.message}`)
              } else {
                pushError(`Escalation SMS failed for ${checkIn.id} — will retry next cron run`)
              }
            } else {
              // No SMS — send email to account owner
              const ownerEmail = await getOwnerEmail(watch.owner_id)
              if (ownerEmail) {
                const watchUrl = `${appUrl}/watches/${watch.id}`
                const emailId = await sendEscalationEmail(ownerEmail, checkIn.assigned_name, displayName, new Date(checkIn.scheduled_time), watchUrl)
                const { error: emailAlertErr } = await admin.from('alerts').insert({
                  watch_id: watch.id,
                  check_in_id: checkIn.id,
                  alert_type: 'missed_checkin',
                  recipient_phone: null,
                  recipient_name: 'Owner (email)',
                  message: `Email escalation: ${checkIn.assigned_name} missed check-in at ${checkIn.scheduled_time}`,
                  delivery_status: emailId ? 'sent' : 'failed',
                })
                if (emailAlertErr) pushError(`Failed to log email escalation for ${checkIn.id}: ${emailAlertErr.message}`)
                if (emailId) {
                  const { error: escUpdateErr } = await admin.rpc('escalate_checkin', {
                    p_checkin_id: checkIn.id,
                    p_escalation_sent_at: new Date().toISOString(),
                    p_ack_token: null,
                  })
                  if (escUpdateErr) pushError(`Failed to mark email escalation for ${checkIn.id}: ${escUpdateErr.message}`)
                }
              }
            }
          } else {
            // Watcher is OFFLINE — send one-time offline alert on first miss only
            if ((watch.consecutive_misses ?? 0) === 0) {
              if (watch.escalation_phone) {
                const offlineSid = await sendOfflineAlertSMS(
                  watch.escalation_phone,
                  checkIn.assigned_name,
                  displayName
                )

                const { error: offlineAlertErr } = await admin.from('alerts').insert({
                  watch_id: watch.id,
                  check_in_id: checkIn.id,
                  alert_type: 'watcher_offline',
                  recipient_phone: watch.escalation_phone,
                  recipient_name: 'Supervisor',
                  message: `${checkIn.assigned_name} appears offline at ${displayName}. Check-ins will sync when connectivity returns.`,
                  delivery_status: offlineSid ? 'sent' : 'failed',
                  twilio_sid: offlineSid,
                })
                if (offlineAlertErr) pushError(`Failed to log offline alert for ${checkIn.id}: ${offlineAlertErr.message}`)

                if (watch.secondary_escalation_phone) {
                  const secOfflineSid = await sendOfflineAlertSMS(
                    watch.secondary_escalation_phone,
                    checkIn.assigned_name,
                    displayName
                  )
                  const { error: secOfflineErr } = await admin.from('alerts').insert({
                    watch_id: watch.id,
                    check_in_id: checkIn.id,
                    alert_type: 'watcher_offline',
                    recipient_phone: watch.secondary_escalation_phone,
                    recipient_name: 'Backup Supervisor',
                    message: `${checkIn.assigned_name} appears offline at ${displayName}. Check-ins will sync when connectivity returns.`,
                    delivery_status: secOfflineSid ? 'sent' : 'failed',
                    twilio_sid: secOfflineSid,
                  })
                  if (secOfflineErr) pushError(`Failed to log secondary offline alert for ${checkIn.id}: ${secOfflineErr.message}`)
                }
              } else {
                // No SMS — send offline alert email to owner
                const ownerEmail = await getOwnerEmail(watch.owner_id)
                if (ownerEmail) {
                  const watchUrl = `${appUrl}/watches/${watch.id}`
                  const emailId = await sendOfflineAlertEmail(ownerEmail, checkIn.assigned_name, displayName, watchUrl)
                  const { error: offlineEmailErr } = await admin.from('alerts').insert({
                    watch_id: watch.id,
                    check_in_id: checkIn.id,
                    alert_type: 'watcher_offline',
                    recipient_phone: null,
                    recipient_name: 'Owner (email)',
                    message: `Email: ${checkIn.assigned_name} appears offline at ${displayName}`,
                    delivery_status: emailId ? 'sent' : 'failed',
                  })
                  if (offlineEmailErr) pushError(`Failed to log offline email for ${checkIn.id}: ${offlineEmailErr.message}`)
                }
              }
            }
            // Subsequent offline misses — stay quiet, supervisor already knows
          }
        } else if (watch.escalation_phone && (watch.escalation_delay_min ?? 0) === 0) {
          // ── Legacy watches with SMS: per-miss escalation ──
          const ackToken = generateToken()
          const ackUrl = `${appUrl}/ack/${ackToken}`

          const alertSid = await sendAlertSMS(
            watch.escalation_phone,
            checkIn.assigned_name,
            displayName,
            new Date(checkIn.scheduled_time),
            ackUrl
          )

          const { error: escAlertErr } = await admin.from('alerts').insert({
            watch_id: watch.id,
            check_in_id: checkIn.id,
            alert_type: 'missed_checkin',
            recipient_phone: watch.escalation_phone,
            recipient_name: 'Supervisor',
            message: `Immediate escalation: ${checkIn.assigned_name} missed check-in at ${checkIn.scheduled_time}`,
            delivery_status: alertSid ? 'sent' : 'failed',
            twilio_sid: alertSid,
          })
          if (escAlertErr) pushError(`Failed to log escalation alert for ${checkIn.id}: ${escAlertErr.message}`)

          if (!alertSid) {
            pushError(`Escalation SMS failed for ${checkIn.id} — will retry next cron run`)
          }
          const { error: escUpdateErr } = alertSid ? await admin.rpc('escalate_checkin', {
            p_checkin_id: checkIn.id,
            p_escalation_sent_at: new Date().toISOString(),
            p_ack_token: ackToken,
          }) : { error: null }
          if (escUpdateErr) pushError(`Failed to mark escalation sent for ${checkIn.id}: ${escUpdateErr.message}`)
        } else if (!watch.escalation_phone && !watch.session_token) {
          // ── Legacy watches without SMS: email fallback ──
          const ownerEmail = await getOwnerEmail(watch.owner_id)
          if (ownerEmail) {
            const watchUrl = `${appUrl}/watches/${watch.id}`
            const emailId = await sendEscalationEmail(ownerEmail, checkIn.assigned_name, displayName, new Date(checkIn.scheduled_time), watchUrl)
            const { error: emailAlertErr } = await admin.from('alerts').insert({
              watch_id: watch.id,
              check_in_id: checkIn.id,
              alert_type: 'missed_checkin',
              recipient_phone: null,
              recipient_name: 'Owner (email)',
              message: `Email escalation: ${checkIn.assigned_name} missed check-in at ${checkIn.scheduled_time}`,
              delivery_status: emailId ? 'sent' : 'failed',
            })
            if (emailAlertErr) pushError(`Failed to log email escalation for ${checkIn.id}: ${emailAlertErr.message}`)
            if (emailId) {
              const { error: escUpdateErr } = await admin.rpc('escalate_checkin', {
                p_checkin_id: checkIn.id,
                p_escalation_sent_at: new Date().toISOString(),
                p_ack_token: null,
              })
              if (escUpdateErr) pushError(`Failed to mark email escalation for ${checkIn.id}: ${escUpdateErr.message}`)
            }
          }
        }

        // Schedule next check-in — use max(now, scheduled+interval) to prevent cascading misses
        // if the cron ran late
        const baseNextTime = addMinutes(new Date(checkIn.scheduled_time), watch.check_interval_min)
        const nextScheduledTime = baseNextTime > new Date() ? baseNextTime : new Date()
        const nextExpiresAt = addMinutes(nextScheduledTime, watch.check_interval_min)
        const nextToken = generateToken()

        const { data: nextCheckIn, error: nextError } = await admin
          .from('check_ins')
          .insert({
            watch_id: watch.id,
            scheduled_time: nextScheduledTime.toISOString(),
            token_expires_at: nextExpiresAt.toISOString(),
            status: 'pending',
            token: nextToken,
            assigned_name: checkIn.assigned_name,
          })
          .select()
          .single()

        // Session-token watches: fire watch already has the persistent link,
        // so skip sending a new SMS. Only send SMS for legacy (non-session) watches.
        if (!nextError && nextCheckIn && !watch.session_token && watch.assigned_phone && watch.sms_consent_confirmed_at) {
          const nextCheckInUrl = `${appUrl}/checkin/${nextToken}`
          const nextSid = await sendCheckInSMS(
            watch.assigned_phone,
            displayName,
            checkIn.assigned_name,
            nextCheckInUrl,
            nextScheduledTime
          )

          const { error: nextAlertErr } = await admin.from('alerts').insert({
            watch_id: watch.id,
            check_in_id: nextCheckIn.id,
            alert_type: nextSid ? 'sms_sent' : 'sms_failed',
            recipient_phone: watch.assigned_phone,
            recipient_name: checkIn.assigned_name,
            message: `Check-in SMS for ${nextScheduledTime.toISOString()}`,
            delivery_status: nextSid ? 'sent' : 'failed',
            twilio_sid: nextSid,
          })
          if (nextAlertErr) pushError(`Failed to log next SMS alert for ${nextCheckIn.id}: ${nextAlertErr.message}`)
        }
      } catch (innerErr) {
        pushError(`Error processing check-in ${checkIn.id}: ${String(innerErr)}`)
      }
    }

    // ── Escalation pass ──────────────────────────────────────────────────────
    // Find missed check-ins that haven't had an escalation SMS sent yet,
    // where the watch has an escalation_phone set and the delay has elapsed.
    const { data: pendingEscalations } = await admin
      .from('check_ins')
      .select('*, watches(*, facilities(*))')
      .eq('status', 'missed')
      .is('escalation_sent_at', null)

    for (const ci of pendingEscalations ?? []) {
      const watch = ci.watches
      if (!watch || watch.status !== 'active' || !watch.escalation_phone) continue
      // Session-token watches: skip delayed escalation if watcher is offline (already got one-time alert)
      // But allow it if watcher is online (genuine miss)
      if (watch.session_token) {
        const syncGraceMs = 5 * 60 * 1000
        const lastSync = watch.last_sync_at ? new Date(watch.last_sync_at).getTime() : 0
        const isRecentlyOnline = lastSync > 0 && (Date.now() - lastSync) < syncGraceMs
        if (!isRecentlyOnline) continue
      }

      const escalateAt = new Date(ci.scheduled_time)
      escalateAt.setMinutes(escalateAt.getMinutes() + (watch.escalation_delay_min ?? 0))
      if (new Date() < escalateAt) continue

      try {
        const facility = watch.facilities
        const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name
        const ackToken = generateToken()
        const ackUrl = `${appUrl}/ack/${ackToken}`

        const escalationSid = await sendAlertSMS(
          watch.escalation_phone,
          ci.assigned_name,
          displayName,
          new Date(ci.scheduled_time),
          ackUrl
        )

        // Only mark as escalated if SMS actually sent
        if (escalationSid) {
          const { error: escPassUpdateErr } = await admin.rpc('escalate_checkin', {
            p_checkin_id: ci.id,
            p_escalation_sent_at: new Date().toISOString(),
            p_ack_token: ackToken,
          })
          if (escPassUpdateErr) pushError(`Failed to mark escalation sent for ${ci.id}: ${escPassUpdateErr.message}`)
        } else {
          pushError(`Escalation SMS failed for ${ci.id} — will retry next cron run`)
        }

        const { error: escPassAlertErr } = await admin.from('alerts').insert({
          watch_id: watch.id,
          check_in_id: ci.id,
          alert_type: 'missed_checkin',
          recipient_phone: watch.escalation_phone,
          recipient_name: 'Escalation',
          message: `Escalation alert sent to supervisor for missed check-in at ${ci.scheduled_time}`,
          delivery_status: escalationSid ? 'sent' : 'failed',
          twilio_sid: escalationSid,
        })
        if (escPassAlertErr) pushError(`Failed to log escalation pass alert for ${ci.id}: ${escPassAlertErr.message}`)
      } catch (innerErr) {
        pushError(`Escalation error for check-in ${ci.id}: ${String(innerErr)}`)
      }
    }

    // ── Secondary escalation pass ────────────────────────────────────────
    // If primary supervisor hasn't acknowledged within 3 minutes,
    // alert the secondary/backup contact.
    const { data: pendingSecondary } = await admin
      .from('check_ins')
      .select('*, watches(*, facilities(*))')
      .eq('status', 'missed')
      .not('escalation_sent_at', 'is', null)
      .is('ack_at', null)

    for (const ci of pendingSecondary ?? []) {
      const watch = ci.watches
      if (!watch || watch.status !== 'active' || !watch.secondary_escalation_phone) continue
      // Session-token watches: skip secondary escalation if offline (already notified)
      if (watch.session_token) {
        const syncGraceMs = 5 * 60 * 1000
        const lastSync = watch.last_sync_at ? new Date(watch.last_sync_at).getTime() : 0
        const isRecentlyOnline = lastSync > 0 && (Date.now() - lastSync) < syncGraceMs
        if (!isRecentlyOnline) continue
      }

      // Check if 3 minutes have passed since primary escalation
      const escalationTime = new Date(ci.escalation_sent_at!)
      const secondaryThreshold = new Date(escalationTime.getTime() + 3 * 60 * 1000)
      if (new Date() < secondaryThreshold) continue

      // Avoid sending secondary escalation more than once
      // We'll check if we already sent an alert to the secondary phone for this check-in
      const { data: existingAlert } = await admin
        .from('alerts')
        .select('id')
        .eq('check_in_id', ci.id)
        .eq('recipient_phone', watch.secondary_escalation_phone)
        .limit(1)

      if (existingAlert && existingAlert.length > 0) continue

      try {
        const facility = watch.facilities
        const displayName = watch.location ? `${facility.name} — ${watch.location}` : facility.name

        const secondarySid = await sendAlertSMS(
          watch.secondary_escalation_phone,
          ci.assigned_name,
          displayName,
          new Date(ci.scheduled_time),
          // Reuse the existing ack URL since ack_token is already set
          `${appUrl}/ack/${ci.ack_token}`
        )

        const { error: secAlertErr } = await admin.from('alerts').insert({
          watch_id: watch.id,
          check_in_id: ci.id,
          alert_type: 'missed_checkin',
          recipient_phone: watch.secondary_escalation_phone,
          recipient_name: 'Backup Supervisor',
          message: `Secondary escalation: ${ci.assigned_name} missed check-in at ${ci.scheduled_time} — primary supervisor unresponsive`,
          delivery_status: secondarySid ? 'sent' : 'failed',
          twilio_sid: secondarySid,
        })
        if (secAlertErr) pushError(`Failed to log secondary escalation for ${ci.id}: ${secAlertErr.message}`)
      } catch (innerErr) {
        pushError(`Secondary escalation error for ${ci.id}: ${String(innerErr)}`)
      }
    }

    return NextResponse.json({
      processed: expiredCheckIns?.length ?? 0,
      missed: missedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
