'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { differenceInMinutes, format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import WatchCard from '@/components/WatchCard'
import toast from 'react-hot-toast'
import type { WatchWithFacility } from '@/types/database'

interface WatchWithLastCheckIn {
  watch: WatchWithFacility
  lastCheckIn: { status: string; completed_at: string | null } | null
  pendingTokenExpiresAt: string | null
}

function isCritical({ watch, lastCheckIn, pendingTokenExpiresAt }: WatchWithLastCheckIn): boolean {
  if (lastCheckIn?.status === 'missed') return true
  if (pendingTokenExpiresAt && new Date(pendingTokenExpiresAt) < new Date()) return true
  if (lastCheckIn?.status === 'completed' && lastCheckIn.completed_at) {
    return differenceInMinutes(new Date(), new Date(lastCheckIn.completed_at)) >= watch.check_interval_min
  }
  return false
}

function urgencyPriority(w: WatchWithLastCheckIn): number {
  if (w.lastCheckIn?.status === 'missed') return 0
  if (isCritical(w)) return 1
  if (w.lastCheckIn?.status === 'completed' && w.lastCheckIn.completed_at) {
    const mins = differenceInMinutes(new Date(), new Date(w.lastCheckIn.completed_at))
    if (mins >= w.watch.check_interval_min * 0.7) return 2  // due soon
    return 4                                                  // ok
  }
  if (!w.lastCheckIn) return 3  // awaiting first check-in
  return 4
}

export default function DashboardPage() {
  const [watches, setWatches] = useState<WatchWithLastCheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [endingId, setEndingId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null | undefined>(undefined)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const loadWatches = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('watches')
      .select('*, facilities(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load watches')
      setLoading(false)
      return
    }

    const watchIds = (data as WatchWithFacility[]).map((w) => w.id)
    const ciMap: Record<string, { status: string; completed_at: string | null }> = {}
    const pendingMap: Record<string, string> = {}
    if (watchIds.length > 0) {
      const [{ data: ciData }, { data: pendingData }] = await Promise.all([
        supabase
          .from('check_ins')
          .select('watch_id, status, completed_at, scheduled_time')
          .in('watch_id', watchIds)
          .in('status', ['completed', 'missed'])
          .order('scheduled_time', { ascending: false }),
        supabase
          .from('check_ins')
          .select('watch_id, token_expires_at')
          .in('watch_id', watchIds)
          .eq('status', 'pending')
          .order('scheduled_time', { ascending: false }),
      ])
      for (const ci of ciData ?? []) {
        if (!ciMap[ci.watch_id]) {
          ciMap[ci.watch_id] = { status: ci.status, completed_at: ci.completed_at }
        }
      }
      for (const ci of pendingData ?? []) {
        if (!pendingMap[ci.watch_id]) {
          pendingMap[ci.watch_id] = ci.token_expires_at
        }
      }
    }
    const watchesWithCheckIns: WatchWithLastCheckIn[] = (data as WatchWithFacility[]).map((w) => ({
      watch: w,
      lastCheckIn: ciMap[w.id] ?? null,
      pendingTokenExpiresAt: pendingMap[w.id] ?? null,
    }))

    // Missed → overdue → due soon → awaiting → ok
    watchesWithCheckIns.sort((a, b) => urgencyPriority(a) - urgencyPriority(b))

    setWatches(watchesWithCheckIns)
    setLastUpdated(new Date())
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    loadWatches()
    const interval = setInterval(loadWatches, 60_000)
    return () => clearInterval(interval)
  }, [loadWatches])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('checkout=success')) {
      toast.success('Trial activated! 60 days free — no charge until day 60.', { duration: 8000 })
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  useEffect(() => {
    async function loadSubscription() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      setSubscriptionStatus(profile?.subscription_status ?? null)
    }
    loadSubscription()
  }, [])

  async function handleEndWatch(id: string) {
    setEndingId(id)
    try {
      const res = await fetch('/api/watches/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to end watch')
      toast.success('Watch ended. Summary sent.')
      loadWatches(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to end watch')
    } finally {
      setEndingId(null)
    }
  }

  const criticalWatches = watches.filter(isCritical)

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-xl sm:text-3xl text-slate-900"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Active Watches
            </h2>
            <p className="text-slate-400 text-sm mt-1">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white border border-slate-200 animate-pulse h-52 shadow-sm" />
          ))}
        </div>
      </div>
    )
  }

  const showTrialBanner = subscriptionStatus === null
  const showPastDueBanner = subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid'

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      {showTrialBanner && (
        <div className="mb-6 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-blue-800 text-sm">Start your 60-day free trial</p>
            <p className="text-blue-600 text-xs mt-0.5">Set up billing to activate SMS check-ins. No charge until your trial ends.</p>
          </div>
          <Link
            href="/billing"
            className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Set up trial →
          </Link>
        </div>
      )}
      {showPastDueBanner && (
        <div className="mb-6 flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-lg leading-none">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800 text-sm">Payment issue — SMS check-ins may be paused</p>
            <p className="text-amber-600 text-xs mt-0.5">Update your payment method to keep watches running.</p>
          </div>
          <Link
            href="/billing"
            className="flex-shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Fix billing →
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl sm:text-3xl text-slate-900"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Active Watches
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400 text-sm">
              {watches.length === 0
                ? 'No active watches'
                : `${watches.length} watch${watches.length !== 1 ? 'es' : ''} in progress`}
              {lastUpdated && (
                <span className="text-slate-600 ml-2">· Updated {format(lastUpdated, 'h:mm:ss a')}</span>
              )}
            </p>
            <button
              onClick={() => loadWatches(true)}
              disabled={refreshing}
              aria-label="Refresh watches"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold transition-all disabled:opacity-40 shadow-sm"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                className={refreshing ? 'animate-spin' : ''}
                aria-hidden="true"
              >
                <path
                  d="M13.65 2.35A8 8 0 1 0 15 8h-2a6 6 0 1 1-1.05-3.4L9 7h6V1l-1.35 1.35z"
                  fill="currentColor"
                />
              </svg>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        <Link
          href="/watches/new"
          className="hidden sm:flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-px shadow-lg shadow-blue-200"
        >
          + Start New Watch
        </Link>
      </div>

      {/* Urgency alert banner */}
      {criticalWatches.length > 0 && (
        <div className="mb-6 flex items-center gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-lg leading-none">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-700 text-sm">
              {criticalWatches.length === 1
                ? '1 watch requires immediate attention'
                : `${criticalWatches.length} watches require immediate attention`}
            </p>
            <p className="text-red-500 text-xs mt-0.5 truncate">
              {criticalWatches.map(({ watch }) =>
              watch.location ? `${watch.facilities.name} — ${watch.location}` : watch.facilities.name
            ).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {watches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="text-center py-14 px-6 border-b border-slate-100">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
            </div>
            <h3
              className="text-lg font-bold text-slate-800 mb-2"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              No active fire watches
            </h3>
            <p className="text-slate-400 text-sm mb-7 max-w-sm mx-auto">
              Start a watch to begin automated SMS check-ins and compliance documentation.
            </p>
            <Link
              href="/watches/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-200"
            >
              Start a Watch →
            </Link>
          </div>
          {/* Quick-start steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {[
              { step: '1', title: 'Add a job site', desc: 'Register your company or the site where hot work will be performed.', href: '/facilities', cta: 'Go to Job Sites →' },
              { step: '2', title: 'Start a watch', desc: 'Enter the worker\'s phone number and set your check-in interval.', href: '/watches/new', cta: 'Start a Watch →' },
              { step: '3', title: 'Download your report', desc: 'When the watch ends, get a one-click PDF for inspectors.', href: '/history', cta: 'View History →' },
            ].map(({ step, title, desc, href, cta }) => (
              <div key={step} className="px-7 py-6">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center mb-3">{step}</div>
                <p className="font-bold text-slate-800 text-sm mb-1">{title}</p>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">{desc}</p>
                <Link href={href} className="text-blue-600 hover:text-blue-500 text-xs font-semibold transition-colors">{cta}</Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {watches.map(({ watch, lastCheckIn, pendingTokenExpiresAt }) => (
            <WatchCard
              key={watch.id}
              watch={watch}
              lastCheckIn={lastCheckIn}
              pendingTokenExpiresAt={pendingTokenExpiresAt}
              onEnd={handleEndWatch}
              ending={endingId === watch.id}
              now={now}
            />
          ))}
        </div>
      )}
    </div>
  )
}
