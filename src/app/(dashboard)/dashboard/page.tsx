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
    if (mins >= w.watch.check_interval_min * 0.7) return 2
    return 4
  }
  if (!w.lastCheckIn) return 3
  return 4
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Icons ──────────────────────────────────────────────────── */

function IconFire({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function IconAlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" strokeWidth={2} />
    </svg>
  )
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */

export default function DashboardPage() {
  const [watches, setWatches] = useState<WatchWithLastCheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [endingId, setEndingId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [userName, setUserName] = useState<string | null>(null)
  const [facilityCount, setFacilityCount] = useState<number | null>(null)
  const [completedWatchCount, setCompletedWatchCount] = useState<number | null>(null)
  const [totalWatchCount, setTotalWatchCount] = useState<number | null>(null)
  const [planTier, setPlanTier] = useState<string | null>(null)

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
      setLoadError(true)
      setLoading(false)
      return
    }
    setLoadError(false)

    const watchIds = (data as WatchWithFacility[]).map((w) => w.id)
    const ciMap: Record<string, { status: string; completed_at: string | null }> = {}
    const pendingMap: Record<string, string> = {}
    if (watchIds.length > 0) {
      const [{ data: ciData, error: ciError }, { data: pendingData, error: pendingError }] = await Promise.all([
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
      if (ciError || pendingError) {
        console.error('Dashboard check-in query error:', ciError ?? pendingError)
        toast.error('Some watch data may be incomplete')
      }
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('checkout') === 'success') {
        toast.success('Subscription activated! You now have full access to DutyProof.', { duration: 8000 })
        window.history.replaceState({}, '', '/dashboard')
      }
    }
  }, [])

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use full_name from signup, skip greeting if no name stored
      const meta = user.user_metadata as Record<string, string> | undefined
      const fullName = meta?.full_name?.trim()
      if (fullName) {
        setUserName(fullName.split(' ')[0])
      }

      const [{ data: profile }, { count: fCount }, { count: wCount }, { count: totalCount }] = await Promise.all([
        supabase.from('profiles').select('subscription_status, is_admin, plan_tier').eq('id', user.id).single(),
        supabase.from('facilities').select('id', { count: 'exact', head: true }),
        supabase.from('watches').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('watches').select('id', { count: 'exact', head: true }),
      ])
      setSubscriptionStatus(profile?.subscription_status ?? null)
      setIsAdmin(profile?.is_admin ?? false)
      setPlanTier(profile?.plan_tier ?? null)
      setFacilityCount(fCount ?? 0)
      setCompletedWatchCount(wCount ?? 0)
      setTotalWatchCount(totalCount ?? 0)
    }
    loadUserData()
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
  const isBeta = process.env.NEXT_PUBLIC_BETA_MODE === 'true'
  const noSubscription = subscriptionStatus === null && !isAdmin
  const hasUsedFreeWatch = (totalWatchCount ?? 0) > 0
  const showFreeWatchBanner = !isBeta && noSubscription && !hasUsedFreeWatch
  const showUpgradeBanner = !isBeta && noSubscription && hasUsedFreeWatch
  const showPastDueBanner = !isBeta && (subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid')

  // Onboarding progress
  const hasSites = facilityCount !== null && facilityCount > 0

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Billing banners ───────────────────────────── */}
        {showFreeWatchBanner && (
          <div className="mb-6 flex items-center gap-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
              <IconFire className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-emerald-900 text-sm">Your first watch is free</p>
              <p className="text-emerald-600 text-xs mt-0.5">Run a complete watch with SMS, check-ins, and a PDF report — on us. No card required.</p>
            </div>
          </div>
        )}
        {showUpgradeBanner && (
          <div className="mb-6 flex items-center gap-4 bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
              <IconLayers className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-blue-900 text-sm">Subscribe to keep going</p>
              <p className="text-blue-600 text-xs mt-0.5">Your free watch is done. Plans start at $199/mo.</p>
            </div>
            <Link
              href="/billing"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-200/60 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Subscribe
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
        {showPastDueBanner && (
          <div className="mb-6 flex items-center gap-4 bg-amber-50 border-2 border-amber-100 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
              <IconAlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 text-sm">Payment issue — check-ins may be paused</p>
              <p className="text-amber-700 text-xs mt-0.5">Update your payment method to keep watches running.</p>
            </div>
            <Link
              href="/billing"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-200/60 hover:-translate-y-0.5"
            >
              Fix billing
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200">
              <IconFire className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-xl sm:text-2xl text-slate-900 leading-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                Active Watches
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-slate-500 text-xs">
                  {loading
                    ? 'Loading...'
                    : watches.length === 0
                      ? 'No active watches'
                      : `${watches.length} watch${watches.length !== 1 ? 'es' : ''} in progress`}
                  {lastUpdated && !loading && (
                    <span className="text-slate-500 ml-1.5">
                      &bull; {format(lastUpdated, 'h:mm a')}
                    </span>
                  )}
                </p>
                {!loading && (
                  <button
                    onClick={() => loadWatches(true)}
                    disabled={refreshing}
                    aria-label="Refresh watches"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all disabled:opacity-40"
                  >
                    <IconRefresh className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing && <span>Refreshing...</span>}
                  </button>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/watches/new"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm
              transition-all duration-200 shadow-lg shadow-blue-200/60
              hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200/80"
          >
            <IconPlus className="w-4 h-4" />
            New Watch
          </Link>
        </div>

        {/* ── Urgency Alert ─────────────────────────────── */}
        {criticalWatches.length > 0 && (
          <div className="mb-6 flex items-center gap-4 bg-red-50 border-2 border-red-200 rounded-2xl px-5 py-4 ring-4 ring-red-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-200 animate-pulse">
              <IconAlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-800 text-sm">
                {criticalWatches.length === 1
                  ? '1 watch requires immediate attention'
                  : `${criticalWatches.length} watches require immediate attention`}
              </p>
              <p className="text-red-500 text-xs mt-0.5 truncate">
                {criticalWatches.map(({ watch }) =>
                  watch.location ? `${watch.facilities.name} \u2014 ${watch.location}` : watch.facilities.name
                ).join(' \u00b7 ')}
              </p>
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden animate-pulse">
                <div className="h-1.5 bg-slate-100" />
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="h-5 w-36 bg-slate-100 rounded-lg mb-2" />
                      <div className="h-3 w-24 bg-slate-100 rounded-lg mb-3" />
                      <div className="h-7 w-32 bg-slate-100 rounded-lg" />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-slate-100 rounded-lg" />
                    <div className="h-10 bg-slate-100 rounded-lg" />
                  </div>
                </div>
                <div className="border-t-2 border-slate-50 px-4 py-3 flex gap-2">
                  <div className="flex-1 h-10 bg-slate-100 rounded-xl" />
                  <div className="flex-1 h-10 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          /* ── Error State ──────────────────────────────── */
          <div className="bg-white rounded-2xl border-2 border-red-100 text-center py-16 px-6">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
              <IconAlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3
              className="text-lg text-slate-800 mb-2"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              Failed to load watches
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              There was an error loading your active watches. Please try again.
            </p>
            <button
              onClick={() => loadWatches(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-200/60 hover:-translate-y-0.5"
            >
              <IconRefresh className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : watches.length === 0 ? (
          /* ── Empty State ──────────────────────────────── */
          <div>
            {hasSites ? (
              /* ── Returning user: clean & confident ──── */
              <div className="relative rounded-2xl border-2 border-slate-100 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #fefefe 0%, #f8fafc 50%, #fff7ed 100%)' }}
              >
                <div className="relative px-8 py-16 sm:py-20 text-center">
                  {userName && (
                    <p className="text-sm font-semibold text-slate-500 mb-4">{getGreeting()}, {userName}</p>
                  )}
                  <h3
                    className="text-3xl sm:text-4xl text-slate-900 mb-3 tracking-tight"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                  >
                    No active watches
                  </h3>
                  <p className="text-slate-600 text-base max-w-md mx-auto leading-relaxed mb-10">
                    All clear. Start a new watch when you&apos;re ready.
                  </p>

                  <Link
                    href="/watches/new"
                    className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm
                      transition-all duration-200 shadow-lg shadow-blue-200/60
                      hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200/80"
                  >
                    <IconPlus className="w-4 h-4" />
                    Start a Watch
                    <IconArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Quick stats */}
                <div className="border-t border-slate-100 bg-white/60 backdrop-blur-sm">
                  <div className="grid grid-cols-3 divide-x divide-slate-100">
                    <Link href="/facilities" className="group px-6 py-5 text-center hover:bg-white/80 transition-colors">
                      <p className="text-2xl font-extrabold text-slate-800 mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>{facilityCount}</p>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Job Sites</p>
                    </Link>
                    <Link href="/history" className="group px-6 py-5 text-center hover:bg-white/80 transition-colors">
                      <p className="text-2xl font-extrabold text-slate-800 mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>{completedWatchCount}</p>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Reports</p>
                    </Link>
                    <div className="px-6 py-5 text-center">
                      <p className="text-2xl font-extrabold text-emerald-500 mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>0</p>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Missed</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Brand new user: focused onboarding ──── */
              <div className="relative rounded-2xl border-2 border-slate-100 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #fefefe 0%, #f8fafc 50%, #f1f5f9 100%)' }}
              >
                <div className="relative px-8 py-16 sm:py-20 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-xl shadow-orange-200/50">
                    <IconFire className="w-8 h-8 text-white" />
                  </div>

                  {userName && (
                    <p className="text-sm font-semibold text-slate-500 mb-2">{getGreeting()}, {userName}</p>
                  )}
                  <h3
                    className="text-3xl sm:text-4xl text-slate-900 mb-3 tracking-tight"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                  >
                    Let&apos;s set up your first watch
                  </h3>
                  <p className="text-slate-600 text-base max-w-md mx-auto leading-relaxed mb-10">
                    Add a job site, then start a watch. Your fire watch gets a check-in
                    link on their phone — every check-in is GPS&#8209;verified and audit&#8209;ready.
                  </p>

                  <Link
                    href="/facilities"
                    className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm
                      transition-all duration-200 shadow-lg shadow-blue-200/60
                      hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200/80"
                  >
                    <IconBuilding className="w-4 h-4" />
                    Add Your First Job Site
                    <IconArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* How it works — minimal */}
                <div className="border-t border-slate-100 bg-white/60 backdrop-blur-sm">
                  <div className="grid grid-cols-3 divide-x divide-slate-100">
                    {[
                      { num: '1', label: 'Add a job site' },
                      { num: '2', label: 'Start a watch' },
                      { num: '3', label: 'Get your report' },
                    ].map(({ num, label }) => (
                      <div key={num} className="px-6 py-5 text-center">
                        <p className="text-2xl font-extrabold text-slate-400 mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>{num}</p>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Watch Cards Grid ─────────────────────────── */
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

        {/* ── Mobile FAB ────────────────────────────────── */}
        <Link
          href="/watches/new"
          className="sm:hidden fixed right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-300/50
            flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-50"
          style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
        >
          <IconPlus className="w-6 h-6" />
        </Link>
      </div>
    </div>
  )
}
