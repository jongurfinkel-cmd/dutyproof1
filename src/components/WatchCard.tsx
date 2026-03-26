'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, differenceInMinutes } from 'date-fns'
import type { WatchWithFacility } from '@/types/database'

interface WatchCardProps {
  watch: WatchWithFacility
  lastCheckIn: { status: string; completed_at: string | null } | null
  pendingTokenExpiresAt: string | null
  onEnd: (id: string) => void
  ending: boolean
  now: Date
}

/* ── Icons ──────────────────────────────────────────────────── */

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconFire({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconSquare({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

/* ── Countdown Ring ─────────────────────────────────────────── */

function CountdownRing({ remaining, interval, late }: { remaining: number; interval: number; late: boolean }) {
  const pct = late ? 0 : Math.max(0, Math.min(1, remaining / interval))
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const color = late ? '#ef4444' : pct > 0.3 ? '#22c55e' : '#f59e0b'

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        <circle
          cx="26" cy="26" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm font-extrabold tabular-nums leading-none ${late ? 'text-red-500' : 'text-slate-700'}`}>
          {late ? `+${Math.abs(remaining)}` : remaining}
        </span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">min</span>
      </div>
    </div>
  )
}

/* ── Card ───────────────────────────────────────────────────── */

export default memo(function WatchCard({ watch, lastCheckIn, pendingTokenExpiresAt, onEnd, ending, now }: WatchCardProps) {
  const [confirmingEnd, setConfirmingEnd] = useState(false)

  const pendingExpired = !!pendingTokenExpiresAt && new Date(pendingTokenExpiresAt) < now

  function getStatus(): { color: string; bg: string; border: string; text: string; dotColor: string; severity: 'red' | 'amber' | 'green' | 'slate' } {
    if (lastCheckIn?.status === 'missed') {
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'MISSED CHECK-IN', dotColor: 'bg-red-500', severity: 'red' }
    }
    if (pendingExpired) {
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'OVERDUE', dotColor: 'bg-red-500', severity: 'red' }
    }
    if (pendingTokenExpiresAt && !pendingExpired) {
      const remaining = differenceInMinutes(new Date(pendingTokenExpiresAt), now)
      if (remaining <= watch.check_interval_min * 0.3) {
        return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Due soon', dotColor: 'bg-amber-400', severity: 'amber' }
      }
    }
    if (!lastCheckIn) {
      return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Awaiting first check-in', dotColor: 'bg-amber-400', severity: 'amber' }
    }
    if (lastCheckIn.status === 'completed' && lastCheckIn.completed_at) {
      const minsSince = differenceInMinutes(now, new Date(lastCheckIn.completed_at))
      const interval = watch.check_interval_min
      if (minsSince < interval * 0.7) {
        return {
          color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
          text: `Checked in ${formatDistanceToNow(new Date(lastCheckIn.completed_at), { addSuffix: true })}`,
          dotColor: 'bg-emerald-500', severity: 'green',
        }
      } else if (minsSince < interval) {
        return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Due soon', dotColor: 'bg-amber-400', severity: 'amber' }
      } else {
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'OVERDUE', dotColor: 'bg-red-500', severity: 'red' }
      }
    }
    return { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', text: 'Pending', dotColor: 'bg-slate-400', severity: 'slate' }
  }

  const status = getStatus()

  const countdown = (() => {
    if (pendingTokenExpiresAt) {
      const remaining = differenceInMinutes(new Date(pendingTokenExpiresAt), now)
      return { remaining, late: remaining < 0 }
    }
    if (lastCheckIn?.status === 'completed' && lastCheckIn.completed_at) {
      const minsSince = differenceInMinutes(now, new Date(lastCheckIn.completed_at))
      const remaining = watch.check_interval_min - minsSince
      return { remaining, late: remaining <= 0 }
    }
    return null
  })()

  const cardBorderColor = status.severity === 'red'
    ? 'border-red-200 ring-red-50'
    : status.severity === 'amber'
      ? 'border-amber-200 ring-amber-50'
      : status.severity === 'green'
        ? 'border-slate-100'
        : 'border-slate-100'

  const topAccent = status.severity === 'red'
    ? 'bg-gradient-to-r from-red-400 to-red-500'
    : status.severity === 'amber'
      ? 'bg-gradient-to-r from-amber-300 to-amber-400'
      : status.severity === 'green'
        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
        : 'bg-gradient-to-r from-slate-300 to-slate-400'

  return (
    <div className={`bg-white rounded-2xl border-2 ${cardBorderColor} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
      status.severity === 'red' ? 'ring-4 ring-red-50' : ''
    }`}>
      {/* Top accent bar */}
      <div className={`h-1.5 ${topAccent}`} />

      <div className="p-5">
        {/* Header: site name + countdown ring */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-slate-900 text-[15px] leading-snug truncate"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              {watch.facilities.name}
            </h3>
            {watch.location && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <IconMapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{watch.location}</span>
              </div>
            )}

            {/* Status badge */}
            <div className={`inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-lg ${status.bg} border ${status.border}`}>
              <span className={`w-2 h-2 rounded-full ${status.dotColor} ${
                status.severity === 'green' ? 'animate-pulse' : status.severity === 'red' ? 'animate-pulse' : ''
              }`} />
              <span className={`text-xs font-bold ${status.color}`}>{status.text}</span>
            </div>
          </div>

          {/* Countdown ring */}
          {countdown ? (
            <CountdownRing remaining={countdown.remaining} interval={watch.check_interval_min} late={countdown.late} />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-100 flex flex-col items-center justify-center shrink-0">
              <span className="text-sm font-extrabold text-slate-600 tabular-nums">{watch.check_interval_min}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">min</span>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <div className="flex items-center gap-2">
            <IconUser className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fire Watch</div>
              <div className="text-sm text-slate-700 font-semibold truncate">{watch.assigned_name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconClock className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Started</div>
              <div className="text-sm text-slate-700 font-semibold">
                {formatDistanceToNow(new Date(watch.start_time), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {watch.checklist_token && (
            watch.checklist_completed_at ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <IconCheck className="w-2.5 h-2.5" />
                Checklist done
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Checklist pending
              </span>
            )
          )}
          {watch.escalation_phone && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
              <IconShield className="w-2.5 h-2.5" />
              Supervisor ON
            </span>
          )}
          {watch.reason && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full truncate max-w-[120px] sm:max-w-[140px]">
              <IconFire className="w-2.5 h-2.5 shrink-0" />
              {watch.reason}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t-2 border-slate-50 px-4 py-3 flex gap-2">
        <Link
          href={`/watches/${watch.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 min-h-[44px] text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 active:scale-[0.97]"
        >
          <IconEye className="w-4 h-4" />
          View Details
        </Link>

        <div className="w-px bg-slate-100" />

        {confirmingEnd ? (
          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={() => { onEnd(watch.id); setConfirmingEnd(false) }}
              disabled={ending}
              className="flex-1 py-3 min-h-[44px] text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-all duration-200 active:scale-[0.97]"
            >
              {ending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ending...
                </span>
              ) : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirmingEnd(false)}
              disabled={ending}
              className="px-4 py-3 min-h-[44px] text-sm font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors active:scale-[0.97]"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingEnd(true)}
            disabled={ending}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 min-h-[44px] text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 disabled:text-slate-300 rounded-xl transition-all duration-200 active:scale-[0.97]"
          >
            <IconSquare className="w-3.5 h-3.5" />
            End Watch
          </button>
        )}
      </div>
    </div>
  )
})
