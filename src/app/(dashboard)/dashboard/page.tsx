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

function IconRocket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
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

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
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

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
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

      const [{ data: profile }, { count: fCount }, { count: wCount }] = await Promise.all([
        supabase.from('profiles').select('subscription_status, is_admin').eq('id', user.id).single(),
        supabase.from('facilities').select('id', { count: 'exact', head: true }),
        supabase.from('watches').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      ])
      setSubscriptionStatus(profile?.subscription_status ?? null)
      setIsAdmin(profile?.is_admin ?? false)
      setFacilityCount(fCount ?? 0)
      setCompletedWatchCount(wCount ?? 0)
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
  const showTrialBanner = subscriptionStatus === null && !isAdmin
  const showPastDueBanner = subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid'

  // Onboarding progress
  const hasSites = facilityCount !== null && facilityCount > 0
  const hasCompletedWatches = completedWatchCount !== null && completedWatchCount > 0
  const stepsCompleted = (hasSites ? 1 : 0) + (hasCompletedWatches ? 1 : 0)

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Billing banners ───────────────────────────── */}
        {showTrialBanner && (
          <div className="mb-6 flex items-center gap-4 bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
              <IconLayers className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-blue-900 text-sm">Subscribe to activate DutyProof</p>
              <p className="text-blue-600 text-xs mt-0.5">Set up billing to activate check-ins. $199/mo flat rate, unlimited sites.</p>
            </div>
            <Link
              href="/billing"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-200/60 hover:-translate-y-0.5"
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
                    <span className="text-slate-400 ml-1.5">
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
            {/* Welcome Hero */}
            <div className="relative rounded-2xl border-2 border-slate-100 overflow-hidden mb-6"
              style={{ background: 'linear-gradient(135deg, #fefefe 0%, #f8fafc 50%, #f1f5f9 100%)' }}
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.03] pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none">
                  <path d="M100 180c-20-12-40-30-50-55-10-25-8-50 0-70 5-13 10-25 14-38 2 9 6 20 12 30 5-12 8-25 7-38 14 15 24 35 19 55 3-7 5-15 4-22 10 12 13 28 5 45-8 17-14 28-20 35-6 7-12 14-18 20l17-37z" fill="currentColor" className="text-orange-500"/>
                </svg>
              </div>

              <div className="relative px-8 py-12 sm:py-14 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-xl shadow-orange-200/50">
                  <IconFire className="w-8 h-8 text-white" />
                </div>

                {userName && (
                  <p className="text-sm font-semibold text-slate-400 mb-1">{getGreeting()}, {userName}</p>
                )}
                <h3
                  className="text-2xl text-slate-800 mb-3"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                >
                  Ready to start a fire watch?
                </h3>
                <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed mb-8">
                  Your fire watch gets a check-in link on their phone — no app needed.
                  Every check-in is timestamped, GPS-verified, and audit-ready.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-2.5 mb-8">
                  {[
                    { icon: IconLink, text: 'Link-based check-ins' },
                    { icon: IconMapPin, text: 'GPS verification' },
                    { icon: IconShield, text: 'Tamper-proof records' },
                    { icon: IconFileText, text: 'One-click PDF reports' },
                  ].map(({ icon: Icon, text }) => (
                    <span
                      key={text}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-sm"
                    >
                      <Icon className="w-3.5 h-3.5 text-orange-400" />
                      {text}
                    </span>
                  ))}
                </div>

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
            </div>

            {/* Getting Started Steps */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4 px-1">
                <h4 className="text-sm font-bold text-slate-700" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  Getting Started
                </h4>
                {facilityCount !== null && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`w-8 h-1.5 rounded-full transition-colors ${
                            i < stepsCompleted ? 'bg-emerald-400' : i === stepsCompleted ? 'bg-blue-400' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{stepsCompleted}/3</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    step: '1',
                    icon: IconBuilding,
                    title: 'Add a job site',
                    desc: 'Add the location where hot work will be performed.',
                    href: '/facilities',
                    cta: hasSites ? `${facilityCount} site${facilityCount !== 1 ? 's' : ''} added` : 'Add Job Site',
                    gradient: 'from-blue-500 to-blue-600',
                    shadow: 'shadow-blue-200',
                    done: hasSites,
                  },
                  {
                    step: '2',
                    icon: IconRocket,
                    title: 'Start a watch',
                    desc: 'Assign a fire watch, set the check-in interval, and launch.',
                    href: '/watches/new',
                    cta: 'Start a Watch',
                    gradient: 'from-violet-500 to-violet-600',
                    shadow: 'shadow-violet-200',
                    done: false,
                  },
                  {
                    step: '3',
                    icon: IconFileText,
                    title: 'Download your report',
                    desc: 'Once the watch ends, download a compliance PDF.',
                    href: '/history',
                    cta: hasCompletedWatches ? `${completedWatchCount} report${completedWatchCount !== 1 ? 's' : ''} ready` : 'View History',
                    gradient: 'from-emerald-500 to-emerald-600',
                    shadow: 'shadow-emerald-200',
                    done: hasCompletedWatches,
                  },
                ].map(({ step, icon: Icon, title, desc, href, cta, gradient, shadow, done }) => (
                  <Link
                    key={step}
                    href={href}
                    className={`block bg-white rounded-2xl border-2 p-6 transition-all duration-200 group relative overflow-hidden ${
                      done
                        ? 'border-emerald-100 hover:border-emerald-200 hover:shadow-md'
                        : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                    }`}
                  >
                    {done && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Step {step}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-[15px] mb-1.5">{title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4">{desc}</p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all ${
                      done ? 'text-emerald-500' : 'text-blue-600 group-hover:gap-2.5'
                    }`}>
                      {done && <IconCheck className="w-3 h-3" />}
                      {cta}
                      {!done && <IconArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
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
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-300/50
            flex items-center justify-center transition-all duration-200 hover:scale-105 z-50"
        >
          <IconPlus className="w-6 h-6" />
        </Link>
      </div>
    </div>
  )
}
