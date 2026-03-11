'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import CheckInTimeline from '@/components/CheckInTimeline'
import CheckInMapDynamic from '@/components/CheckInMapDynamic'
import toast from 'react-hot-toast'
import type { WatchWithFacility, CheckIn, Alert, WatchChecklistItem, ChecklistCompletion } from '@/types/database'

export default function WatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [watch, setWatch] = useState<WatchWithFacility | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [checklistItems, setChecklistItems] = useState<WatchChecklistItem[]>([])
  const [checklistCompletions, setChecklistCompletions] = useState<ChecklistCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [ending, setEnding] = useState(false)
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [resendingSms, setResendingSms] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [watchRes, checkInsRes, alertsRes, itemsRes, completionsRes] = await Promise.all([
      supabase.from('watches').select('*, facilities(*)').eq('id', id).single(),
      supabase.from('check_ins').select('*').eq('watch_id', id).order('scheduled_time', { ascending: true }),
      supabase.from('alerts').select('*').eq('watch_id', id).order('created_at', { ascending: true }),
      supabase.from('watch_checklist_items').select('*').eq('watch_id', id).order('sort_order'),
      supabase.from('checklist_completions').select('*').eq('watch_id', id),
    ])
    if (watchRes.error) {
      toast.error('Watch not found')
      router.push('/dashboard')
      return
    }
    const w = watchRes.data as WatchWithFacility
    setWatch(w)
    setCheckIns((checkInsRes.data ?? []) as CheckIn[])
    setAlerts((alertsRes.data ?? []) as Alert[])
    setChecklistItems((itemsRes.data ?? []) as WatchChecklistItem[])
    setChecklistCompletions((completionsRes.data ?? []) as ChecklistCompletion[])
    setLoading(false)
    // Return status so the interval knows whether to stop
    return w.status
  }, [id, router])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    loadData().then((status) => {
      if (status !== 'completed') {
        interval = setInterval(async () => {
          const s = await loadData()
          if (s === 'completed' && interval) {
            clearInterval(interval)
            interval = null
          }
        }, 30_000)
      }
    })
    return () => { if (interval) clearInterval(interval) }
  }, [loadData])

  async function handleEndWatch() {
    setEnding(true)
    setConfirmingEnd(false)
    try {
      const res = await fetch('/api/watches/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to end watch')
      toast.success('Watch ended. Summary sent to admin.')
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error ending watch')
    } finally {
      setEnding(false)
    }
  }

  async function handleResendSms() {
    setResendingSms(true)
    try {
      const res = await fetch('/api/watches/resend-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resend SMS')
      toast.success('SMS resent to worker ✓')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend SMS')
    } finally {
      setResendingSms(false)
    }
  }

  async function handleSimulateCheckin() {
    setSimulating(true)
    try {
      const res = await fetch('/api/checkin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to simulate')
      toast.success('Check-in simulated ✓')
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setSimulating(false)
    }
  }

  async function handleDownloadReport() {
    setDownloading(true)
    const toastId = toast.loading('Generating compliance report…')
    try {
      const res = await fetch(`/api/reports/${id}`)
      if (!res.ok) throw new Error('Failed to generate report')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dutyproof-watch-${id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Report downloaded', { id: toastId })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report', { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-4xl" role="status" aria-label="Loading watch details">
        <div className="animate-pulse space-y-5">
          <div className="h-8 bg-slate-200 rounded-lg w-64" />
          <div className="h-52 bg-white border border-slate-200 rounded-2xl" />
          <div className="h-72 bg-white border border-slate-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!watch) return null

  const completed = checkIns.filter((c) => c.status === 'completed')
  const missed = checkIns.filter((c) => c.status === 'missed')
  const total = completed.length + missed.length
  const pct = total > 0 ? Math.round((completed.length / total) * 100) : 100
  const nextPending = checkIns.find((c) => c.status === 'pending')
  const arcR = 28
  const arcCircumference = 2 * Math.PI * arcR

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-600 text-sm transition-colors">
            ← Back to Dashboard
          </Link>
          <h2
            className="text-xl sm:text-3xl text-slate-900 mt-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            {watch.facilities.name}
            {watch.location && (
              <span className="text-slate-500 font-semibold"> — {watch.location}</span>
            )}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {watch.status === 'active' ? (
              <span className="inline-flex items-center gap-1.5 text-green-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Active Watch
              </span>
            ) : (
              <span className="text-slate-500 font-medium">Completed Watch</span>
            )}
            {' · '}Started {formatDistanceToNow(new Date(watch.start_time), { addSuffix: true })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 sm:justify-end">
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="px-4 py-2.5 border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-sm font-semibold rounded-xl transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {downloading ? 'Generating…' : 'Download Report'}
          </button>
          {watch.status === 'active' && process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleSimulateCheckin}
              disabled={simulating}
              title="Simulate a check-in without sending SMS — for testing only"
              className="px-4 py-2.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-700 text-sm font-semibold rounded-xl transition-all shadow-sm"
            >
              {simulating ? 'Simulating…' : '⚡ Simulate Check-in'}
            </button>
          )}
          {watch.status === 'active' && (
            confirmingEnd ? (
              <>
                <button
                  onClick={handleEndWatch}
                  disabled={ending}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-300 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                >
                  {ending ? 'Ending…' : 'Confirm End'}
                </button>
                <button
                  onClick={() => setConfirmingEnd(false)}
                  disabled={ending}
                  className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-all shadow-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmingEnd(true)}
                disabled={ending}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-300 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                End Watch
              </button>
            )
          )}
        </div>
      </div>

      {/* Watch Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
        <h3
          className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4"
        >
          Watch Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-3 text-sm">
          {watch.location && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Location</div>
              <div className="font-semibold text-slate-800">{watch.location}</div>
            </div>
          )}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Fire Watcher</div>
            <div className="font-semibold text-slate-800">{watch.assigned_name}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Phone</div>
            <div className="font-semibold text-slate-800">{watch.assigned_phone}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Interval</div>
            <div className="font-semibold text-slate-800">Every {watch.check_interval_min} min</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Started</div>
            <div className="font-semibold text-slate-800">{format(new Date(watch.start_time), 'MMM d, h:mm a')}</div>
          </div>
          {watch.ended_at && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Ended</div>
              <div className="font-semibold text-slate-800">{format(new Date(watch.ended_at), 'MMM d, h:mm a')}</div>
            </div>
          )}
          {watch.planned_end_time && !watch.ended_at && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Expected End</div>
              <div className="font-semibold text-slate-800">{format(new Date(watch.planned_end_time), 'MMM d, h:mm a')}</div>
            </div>
          )}
          {nextPending && watch.status === 'active' && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Next Check-in</div>
              <div className="font-semibold text-slate-800">{format(new Date(nextPending.scheduled_time), 'h:mm a')}</div>
            </div>
          )}
          {watch.escalation_phone && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Supervisor</div>
              <div className="font-semibold text-slate-800">{watch.escalation_phone}</div>
              {watch.escalation_delay_min > 0 && (
                <div className="text-[10px] text-slate-500 mt-0.5">Alert after {watch.escalation_delay_min} min</div>
              )}
            </div>
          )}
          {watch.reason && (
            <div className="col-span-2 md:col-span-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Reason</div>
              <div className="font-semibold text-slate-800">{watch.reason}</div>
            </div>
          )}
        </div>

        {/* Check-In Link Delivery — primary method */}
        {nextPending && watch.status === 'active' && (() => {
          const checkinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/checkin/${nextPending.token}`
          return (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Check-In Link Delivery</h3>
              <div className="flex flex-col sm:flex-row gap-5">
                {/* QR Code */}
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <QRCodeSVG value={checkinUrl} size={140} level="M" includeMargin={false} />
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Scan to check in</span>
                </div>
                {/* Actions */}
                <div className="flex-1 flex flex-col gap-3 justify-center">
                  {/* Copy Link — primary action */}
                  <button
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(checkinUrl).then(() => {
                          setCopiedLink(true)
                          setTimeout(() => setCopiedLink(false), 2000)
                        }).catch(() => toast.error('Unable to copy to clipboard'))
                      } catch {
                        toast.error('Unable to copy to clipboard')
                      }
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    {copiedLink ? 'Copied to Clipboard ✓' : 'Copy Check-In Link'}
                  </button>
                  {/* Link preview */}
                  <div className="text-xs text-slate-400 font-mono truncate px-1">{checkinUrl}</div>
                  {/* Send by SMS — secondary/optional */}
                  {watch.assigned_phone && (
                    <button
                      onClick={handleResendSms}
                      disabled={resendingSms}
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {resendingSms ? 'Sending…' : 'Send Link via SMS (optional)'}
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400 leading-relaxed px-1">
                    Share this link with the fire watcher via QR code, copy &amp; paste, or optional SMS. No app download required.
                  </p>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Compliance Score */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {/* Arc ring tile */}
        <div className={`rounded-2xl border p-5 text-center shadow-sm flex flex-col items-center justify-center ${pct === 100 ? 'bg-green-50 border-green-100' : pct >= 80 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 72 72" width="64" height="64" className="-rotate-90" role="img" aria-label={`${pct}% compliance rate`}>
              <circle cx="36" cy="36" r="28" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle
                cx="36" cy="36" r="28" fill="none"
                stroke={pct === 100 ? '#22c55e' : pct >= 80 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * arcCircumference} ${arcCircumference}`}
              />
            </svg>
            <span
              className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${pct === 100 ? 'text-green-600' : pct >= 80 ? 'text-amber-600' : 'text-red-600'}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {pct}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-semibold">Compliance</div>
        </div>
        {[
          { label: 'Completed', value: completed.length, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Missed', value: missed.length, color: missed.length > 0 ? 'text-red-600' : 'text-slate-800', bg: missed.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200' },
          { label: 'Missed Alerts', value: alerts.filter(a => a.alert_type === 'missed_checkin').length, color: 'text-slate-800', bg: 'bg-white border-slate-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.bg} p-5 text-center shadow-sm`}>
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Safety Checklist Panel */}
      {checklistItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pre-Watch Safety Checklist</h3>
            {watch.checklist_completed_at ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Completed {format(new Date(watch.checklist_completed_at), 'MMM d, h:mm a')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Pending
              </span>
            )}
          </div>
          <div className="space-y-2">
            {checklistItems.map((item) => {
              const completion = checklistCompletions.find((c) => c.item_id === item.id)
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-xl p-3.5 border ${
                    completion ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    completion ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 text-transparent'
                  }`}>
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${completion ? 'text-green-800' : 'text-slate-600'}`}>
                      {item.label}
                    </p>
                    {item.requires_photo && completion?.photo_url && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={completion.photo_url}
                          alt={`Photo for: ${item.label}`}
                          className="w-24 h-24 object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(completion.photo_url!, '_blank')}
                        />
                      </div>
                    )}
                    {item.requires_photo && !completion?.photo_url && (
                      <span className="text-[10px] text-slate-500 font-semibold">📷 Photo required</span>
                    )}
                    {completion && (
                      <p className="text-[10px] text-green-600 mt-1">
                        Logged {format(new Date(completion.completed_at), 'h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Check-In Locations Map */}
      <CheckInMapDynamic checkIns={checkIns} />

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Check-In Timeline</h3>
        <CheckInTimeline checkIns={checkIns} alerts={alerts} />
      </div>
    </div>
  )
}
