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

export default memo(function WatchCard({ watch, lastCheckIn, pendingTokenExpiresAt, onEnd, ending, now }: WatchCardProps) {
  const [confirmingEnd, setConfirmingEnd] = useState(false)

  const pendingExpired = !!pendingTokenExpiresAt && new Date(pendingTokenExpiresAt) < now

  function getStatus(): { color: string; text: string; accent: string; dotColor: string } {
    if (lastCheckIn?.status === 'missed') {
      return { color: 'text-red-600', accent: 'border-l-red-500', text: 'MISSED CHECK-IN', dotColor: 'bg-red-500' }
    }
    if (pendingExpired) {
      return { color: 'text-red-600', accent: 'border-l-red-500', text: 'OVERDUE', dotColor: 'bg-red-500' }
    }
    // "Due soon" via token: window closes in ≤30% of interval
    if (pendingTokenExpiresAt && !pendingExpired) {
      const remaining = differenceInMinutes(new Date(pendingTokenExpiresAt), now)
      if (remaining <= watch.check_interval_min * 0.3) {
        return { color: 'text-amber-600', accent: 'border-l-amber-400', text: 'Due soon', dotColor: 'bg-amber-400' }
      }
    }
    if (!lastCheckIn) {
      return { color: 'text-amber-600', accent: 'border-l-amber-400', text: 'Awaiting first check-in', dotColor: 'bg-amber-400' }
    }
    if (lastCheckIn.status === 'completed' && lastCheckIn.completed_at) {
      const minsSince = differenceInMinutes(now, new Date(lastCheckIn.completed_at))
      const interval = watch.check_interval_min
      if (minsSince < interval * 0.7) {
        return {
          color: 'text-green-600',
          accent: 'border-l-green-500',
          text: `Checked in ${formatDistanceToNow(new Date(lastCheckIn.completed_at), { addSuffix: true })}`,
          dotColor: 'bg-green-500',
        }
      } else if (minsSince < interval) {
        return { color: 'text-amber-600', accent: 'border-l-amber-400', text: 'Due soon', dotColor: 'bg-amber-400' }
      } else {
        return { color: 'text-red-600', accent: 'border-l-red-500', text: 'OVERDUE', dotColor: 'bg-red-500' }
      }
    }
    return { color: 'text-slate-500', accent: 'border-l-slate-300', text: 'Pending', dotColor: 'bg-slate-400' }
  }

  const status = getStatus()

  // Countdown: use pending token expiry when available (most accurate), else fall back to completed_at
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

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${status.accent} shadow-sm hover:shadow-md transition-all`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3
              className="font-bold text-slate-900 text-base truncate"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              {watch.facilities.name}
            </h3>
            {watch.location && (
              <div className="text-xs text-slate-500 font-medium truncate">{watch.location}</div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${status.dotColor} ${status.color === 'text-green-600' ? 'animate-pulse' : ''}`} />
              <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400">
                Started {formatDistanceToNow(new Date(watch.start_time), { addSuffix: true })}
              </span>
              {watch.checklist_token && (
                watch.checklist_completed_at ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    ✓ Checklist
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Checklist pending
                  </span>
                )
              )}
              {watch.escalation_phone && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                  Supervisor ON
                </span>
              )}
            </div>
          </div>

          {/* Interval + live countdown */}
          <div className="text-right shrink-0">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Interval</div>
            <div className="text-lg font-bold text-slate-700">{watch.check_interval_min}m</div>
            {countdown && (
              <div className={`text-[10px] font-bold mt-0.5 ${countdown.late ? 'text-red-500' : 'text-slate-400'}`}>
                {countdown.late
                  ? `${Math.abs(countdown.remaining)}m late`
                  : `${countdown.remaining}m left`}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Worker</div>
            <div className="text-slate-700 font-medium truncate">{watch.assigned_name}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Phone</div>
            <div className="text-slate-700 font-medium truncate">{watch.assigned_phone}</div>
          </div>
        </div>

        {watch.reason && (
          <p className="text-xs text-slate-400 italic mt-3 truncate">{watch.reason}</p>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3 flex gap-2">
        <Link
          href={`/watches/${watch.id}`}
          className="flex-1 text-center py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          View Details
        </Link>

        {confirmingEnd ? (
          <>
            <button
              onClick={() => { onEnd(watch.id); setConfirmingEnd(false) }}
              disabled={ending}
              className="flex-1 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              {ending ? 'Ending…' : 'Confirm End'}
            </button>
            <button
              onClick={() => setConfirmingEnd(false)}
              disabled={ending}
              className="px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmingEnd(true)}
            disabled={ending}
            className="flex-1 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-slate-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            End Watch
          </button>
        )}
      </div>
    </div>
  )
})
