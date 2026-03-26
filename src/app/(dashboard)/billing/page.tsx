'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const includedFeatures = [
  'Unlimited job sites',
  'Unlimited active watches',
  'Automated check-in verification (any interval)',
  'Missed check-in escalation in < 60 seconds',
  'Tamper-proof immutable audit log',
  'One-click OSHA-ready PDF reports',
  'Searchable watch history',
  'Direct email & phone support',
]

type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | null

interface UsageStats {
  totalWatches: number
  activeWatches: number
  totalCheckIns: number
  completedCheckIns: number
  missedCheckIns: number
  totalFacilities: number
  memberSince: string | null
}

// Retention flow steps
type RetentionStep = 'stats' | 'lose' | 'confirm'

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [subStatus, setSubStatus] = useState<SubStatus | undefined>()
  const [isAdmin, setIsAdmin] = useState(false)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null)
  const [firstSubscribedAt, setFirstSubscribedAt] = useState<string | null>(null)
  const [showRetention, setShowRetention] = useState(false)
  const [retentionStep, setRetentionStep] = useState<RetentionStep>('stats')
  const [retentionExiting, setRetentionExiting] = useState(false)

  useEffect(() => {
    async function loadStatus() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSubStatus(null); return }
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_status, is_admin, current_period_end, created_at, first_subscribed_at')
          .eq('id', user.id)
          .single()
        if (error || !profile) {
          setSubStatus(null)
          return
        }
        setSubStatus((profile.subscription_status as SubStatus) ?? null)
        setIsAdmin(profile.is_admin ?? false)
        setCurrentPeriodEnd(profile.current_period_end ?? null)
        setFirstSubscribedAt(profile.first_subscribed_at ?? null)

        // Load usage stats for active subscribers
        const status = (profile.subscription_status as SubStatus) ?? null
        if (status === 'active' || status === 'trialing') {
          const [watchesRes, checkInsRes, facilitiesRes] = await Promise.all([
            supabase.from('watches').select('id, status', { count: 'exact' }).eq('owner_id', user.id),
            supabase.from('check_ins').select('id, status', { count: 'exact' }).in(
              'watch_id',
              (await supabase.from('watches').select('id').eq('owner_id', user.id)).data?.map(w => w.id) ?? []
            ),
            supabase.from('facilities').select('id', { count: 'exact' }).eq('owner_id', user.id),
          ])

          const watches = watchesRes.data ?? []
          const checkIns = checkInsRes.data ?? []

          setUsage({
            totalWatches: watches.length,
            activeWatches: watches.filter(w => w.status === 'active').length,
            totalCheckIns: checkIns.length,
            completedCheckIns: checkIns.filter(c => c.status === 'completed').length,
            missedCheckIns: checkIns.filter(c => c.status === 'missed').length,
            totalFacilities: facilitiesRes.data?.length ?? 0,
            memberSince: profile.created_at ?? null,
          })
        }
      } catch {
        setSubStatus(null)
      }
    }
    loadStatus()
  }, [])

  async function startCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong. Please try again.')
        setPortalLoading(false)
        return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('No billing account found. Subscribe first.')
        setPortalLoading(false)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      setPortalLoading(false)
    }
  }

  const closeRetention = useCallback(() => {
    setRetentionExiting(true)
    setTimeout(() => {
      setShowRetention(false)
      setRetentionStep('stats')
      setRetentionExiting(false)
    }, 300)
  }, [])

  function handleCancelClick() {
    setShowRetention(true)
    setRetentionStep('stats')
    setRetentionExiting(false)
  }

  function proceedToCancel() {
    closeRetention()
    openPortal()
  }

  const isActive = subStatus === 'trialing' || subStatus === 'active'
  const isPastDue = subStatus === 'past_due' || subStatus === 'unpaid'
  const statusLoading = subStatus === undefined

  const complianceRate = usage && usage.totalCheckIns > 0
    ? Math.round((usage.completedCheckIns / usage.totalCheckIns) * 100)
    : null

  const nextBilling = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const memberSinceFormatted = usage?.memberSince
    ? new Date(usage.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  // 30-day money-back guarantee only for first-time subscribers within 30 days
  const refundEligible = (() => {
    if (!firstSubscribedAt) return true // first-timer, hasn't subscribed yet
    const daysSinceFirst = Math.floor((Date.now() - new Date(firstSubscribedAt).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceFirst <= 30
  })()
  const daysLeftForRefund = (() => {
    if (!firstSubscribedAt) return 30
    const days = 30 - Math.floor((Date.now() - new Date(firstSubscribedAt).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  })()

  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 mb-2">Admin Account</h1>
          <p className="text-slate-500">Full access — no subscription required.</p>
        </div>
        <div className="rounded-3xl border-2 border-slate-200 bg-gradient-to-b from-slate-50 to-white overflow-hidden shadow-xl mb-6">
          <div className="bg-slate-800 px-4 py-8 sm:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold tracking-widest uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Admin Access
            </div>
            <p className="text-slate-300 text-sm mt-1">All features unlocked · No billing required</p>
          </div>
          <div className="px-4 py-6 sm:px-8 text-center">
            <p className="text-slate-500 text-sm">This account has admin privileges and bypasses subscription requirements.</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-500 hover:text-slate-600 text-sm transition-colors"
          >
            &larr; Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            {isActive ? 'Your Plan' : 'Subscribe to DutyProof'}
          </h1>
          <p className="text-slate-500">
            {isActive
              ? 'Full access to DutyProof. Manage or cancel any time.'
              : isPastDue
              ? 'There\'s an issue with your payment — update to keep watches running.'
              : 'Unlimited sites. Unlimited watches. One flat price.'}
          </p>
        </div>

        {/* ─── Active subscriber view ─── */}
        {isActive && (
          <div className="space-y-6">
            {/* Plan card */}
            <div className="rounded-3xl border-2 border-green-200 bg-gradient-to-b from-green-50 to-white overflow-hidden shadow-xl shadow-green-100">
              <div className="bg-green-700 px-4 py-6 sm:px-8 sm:py-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold tracking-widest uppercase mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                  {subStatus === 'trialing' ? 'Free Trial Active' : 'Subscription Active'}
                </div>
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">$199</span>
                  <span className="text-green-200 text-base mb-1">/month</span>
                </div>
                <p className="text-green-200 text-sm mt-1">Unlimited sites &middot; Unlimited watches &middot; No per-user fees</p>
              </div>

              {/* Billing details */}
              <div className="px-4 py-5 sm:px-8 border-b border-green-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Status</span>
                    <p className="text-slate-800 font-semibold mt-0.5">
                      {subStatus === 'trialing' ? 'Free Trial' : 'Active'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wide font-semibold">
                      {subStatus === 'trialing' ? 'Trial Ends' : 'Next Billing'}
                    </span>
                    <p className="text-slate-800 font-semibold mt-0.5">{nextBilling ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Member Since</span>
                    <p className="text-slate-800 font-semibold mt-0.5">{memberSinceFormatted ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Plan</span>
                    <p className="text-slate-800 font-semibold mt-0.5">Unlimited</p>
                  </div>
                </div>
              </div>

              {/* Usage stats */}
              {usage && (
                <div className="px-4 py-5 sm:px-8 border-b border-green-100">
                  <h3 className="text-xs uppercase tracking-wide font-semibold text-slate-400 mb-3">Your Usage</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-extrabold text-slate-800">{usage.totalFacilities}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Job Sites</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-extrabold text-slate-800">{usage.totalWatches}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Total Watches</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-extrabold text-slate-800">{usage.activeWatches}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Active Now</div>
                    </div>
                  </div>
                  {usage.totalCheckIns > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500 font-medium">Compliance Rate</span>
                        <span className={`text-xs font-bold ${complianceRate !== null && complianceRate >= 90 ? 'text-green-600' : complianceRate !== null && complianceRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                          {complianceRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${complianceRate !== null && complianceRate >= 90 ? 'bg-green-500' : complianceRate !== null && complianceRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${complianceRate ?? 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>{usage.completedCheckIns.toLocaleString()} completed</span>
                        <span>{usage.missedCheckIns} missed</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* What's included */}
              <div className="px-4 py-5 sm:px-8 border-b border-green-100">
                <h3 className="text-xs uppercase tracking-wide font-semibold text-slate-400 mb-3">What&apos;s Included</h3>
                <div className="grid grid-cols-1 gap-y-2">
                  {includedFeatures.map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">&#10003;</div>
                      <span className="text-slate-600 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-4 py-6 sm:px-8 space-y-3">
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="w-full py-3.5 px-8 rounded-xl bg-green-700 hover:bg-green-600 disabled:bg-slate-300 text-white font-bold text-base shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
                >
                  {portalLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading&hellip;
                    </span>
                  ) : (
                    <>Manage Billing &#8594;</>
                  )}
                </button>
                <p className="text-center text-slate-400 text-xs">
                  Update payment method &middot; View invoices &middot; Download receipts
                </p>
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleCancelClick}
                    className="w-full py-2.5 text-slate-400 hover:text-red-500 text-sm transition-colors"
                  >
                    Cancel subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Past due state ─── */}
        {isPastDue && (
          <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white overflow-hidden shadow-xl shadow-amber-100 mb-6">
            <div className="bg-amber-600 px-4 py-6 sm:px-8 sm:py-8 text-center">
              <div className="text-white font-black text-xl mb-1">Payment Failed</div>
              <p className="text-amber-100 text-sm">Watch features may be paused until resolved.</p>
            </div>
            <div className="px-4 py-6 sm:px-8 sm:py-8 text-center">
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="w-full py-4 px-8 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white font-bold text-base shadow-lg transition-all hover:-translate-y-0.5 disabled:translate-y-0"
              >
                {portalLoading ? 'Loading\u2026' : 'Update Payment Method \u2192'}
              </button>
            </div>
          </div>
        )}

        {/* ─── New subscription / canceled / loading state ─── */}
        {(!isActive && !isPastDue) && (
          <div className={`space-y-6 ${statusLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Free first watch note */}
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-emerald-600 text-sm font-bold">1</span>
              </div>
              <p className="text-emerald-800 text-sm font-medium">
                Your first watch is <strong>free</strong> — run a complete watch with all features before subscribing.
              </p>
            </div>

            <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white overflow-hidden shadow-2xl shadow-blue-100">
              <div className="bg-blue-700 px-4 py-6 sm:px-8 sm:py-8 text-center">
                <div className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-3">Flat Rate &mdash; Unlimited Sites</div>
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white">$199</span>
                  <div className="text-blue-200 text-base mb-3">/month</div>
                </div>
                <p className="text-blue-200 text-sm">Unlimited job sites. Unlimited watches. No per-user fees.</p>
              </div>

              <div className="px-4 py-6 sm:px-8 sm:py-8">
                <div className="grid grid-cols-1 gap-y-2.5 mb-8">
                  {includedFeatures.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">&#10003;</div>
                      <span className="text-slate-700 text-sm">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => startCheckout()}
                  disabled={loading || statusLoading}
                  className="w-full py-4 px-8 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:bg-slate-300 text-white font-bold text-base shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redirecting to checkout&hellip;
                    </span>
                  ) : (
                    'Subscribe \u2014 $199/mo \u2192'
                  )}
                </button>
                <p className="text-center text-slate-500 text-xs mt-3">
                  Secured by Stripe &middot; Cancel any time{refundEligible ? <> &middot; 30-day money-back guarantee</> : null}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-500 hover:text-slate-600 text-sm transition-colors"
          >
            &larr; Back to dashboard
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RETENTION FLOW — Full-screen overlay                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showRetention && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${retentionExiting ? 'opacity-0' : 'opacity-100'}`}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={closeRetention} />

          {/* Modal */}
          <div className={`relative w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${retentionExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>

            {/* Step indicator */}
            <div className="flex gap-1.5 px-6 pt-5">
              {(['stats', 'lose', 'confirm'] as RetentionStep[]).map((step, i) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i <= ['stats', 'lose', 'confirm'].indexOf(retentionStep)
                      ? 'bg-red-400'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={closeRetention}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-lg"
            >
              &times;
            </button>

            {/* ─── Step 1: Your impact stats ─── */}
            {retentionStep === 'stats' && (
              <div className="px-6 py-6 sm:px-8 sm:py-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-1">Before you go&hellip;</h2>
                  <p className="text-slate-500 text-sm">Look at what you&apos;ve built with DutyProof.</p>
                </div>

                {usage && (
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-4 bg-green-50 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-extrabold text-green-700">{usage.totalWatches}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">Fire watches completed</div>
                        <div className="text-slate-500 text-xs">Each one documented and audit-ready</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-blue-50 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-extrabold text-blue-700">{usage.completedCheckIns.toLocaleString()}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">Verified check-ins logged</div>
                        <div className="text-slate-500 text-xs">GPS-stamped, server-verified, immutable</div>
                      </div>
                    </div>
                    {complianceRate !== null && (
                      <div className="flex items-center gap-4 bg-emerald-50 rounded-2xl p-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-extrabold text-emerald-700">{complianceRate}%</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">Compliance rate</div>
                          <div className="text-slate-500 text-xs">Your auditable fire watch track record</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-extrabold text-slate-700">{usage.totalFacilities}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">Job sites configured</div>
                        <div className="text-slate-500 text-xs">Ready for any future watch</div>
                      </div>
                    </div>
                  </div>
                )}

                {!usage && (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    You haven&apos;t created any watches yet — give DutyProof a real try before canceling.
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={closeRetention}
                    className="w-full py-3.5 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
                  >
                    Keep My Subscription
                  </button>
                  <button
                    onClick={() => setRetentionStep('lose')}
                    className="w-full py-3 text-slate-400 hover:text-slate-500 text-sm transition-colors"
                  >
                    I still want to cancel
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 2: What you'll lose ─── */}
            {retentionStep === 'lose' && (
              <div className="px-6 py-6 sm:px-8 sm:py-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-1">Here&apos;s what changes</h2>
                  <p className="text-slate-500 text-sm">If you cancel, these stop immediately at the end of your billing period.</p>
                </div>

                <div className="space-y-2.5 mb-6">
                  {[
                    { label: 'Active watches will stop running', desc: 'No more automated check-in scheduling or monitoring' },
                    { label: 'Missed check-in alerts disabled', desc: 'Supervisors won\'t be notified when a watcher misses' },
                    { label: 'No new watches or check-ins', desc: 'You can\'t start new fire watches or log check-ins' },
                    { label: 'PDF report generation locked', desc: 'Existing reports stay for 12 months, but no new ones' },
                    { label: 'Audit trail becomes read-only', desc: 'Your compliance history is preserved but frozen' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 bg-red-50 rounded-xl p-3.5">
                      <div className="w-5 h-5 rounded-full bg-red-200 text-red-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">&times;</div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{item.label}</div>
                        <div className="text-slate-500 text-xs">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-500 text-lg flex-shrink-0 mt-0.5">&#9888;</span>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">OSHA compliance gap</div>
                      <div className="text-slate-600 text-xs mt-0.5">Without automated fire watch documentation, your crew returns to paper logs — the #1 citation source in OSHA hot work audits.</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={closeRetention}
                    className="w-full py-3.5 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
                  >
                    Keep My Subscription
                  </button>
                  <button
                    onClick={() => setRetentionStep('confirm')}
                    className="w-full py-3 text-slate-400 hover:text-slate-500 text-sm transition-colors"
                  >
                    Continue to cancel
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 3: Final confirmation ─── */}
            {retentionStep === 'confirm' && (
              <div className="px-6 py-6 sm:px-8 sm:py-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-1">We&apos;d hate to see you go</h2>
                  <p className="text-slate-500 text-sm">
                    If something isn&apos;t working right, we&apos;d love to fix it.
                    Email us at <a href="mailto:support@dutyproof.com" className="text-blue-600 hover:underline font-medium">support@dutyproof.com</a> and we&apos;ll respond within 24 hours.
                  </p>
                </div>

                {refundEligible ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
                    <div className="font-semibold text-slate-800 text-sm mb-1">You have {daysLeftForRefund} day{daysLeftForRefund !== 1 ? 's' : ''} left on your money-back guarantee</div>
                    <div className="text-slate-500 text-xs">Email <a href="mailto:support@dutyproof.com" className="text-blue-600 hover:underline">support@dutyproof.com</a> for a full refund — no questions asked.</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
                    <div className="text-slate-500 text-xs">Need help? Email <a href="mailto:support@dutyproof.com" className="text-blue-600 hover:underline">support@dutyproof.com</a> and we&apos;ll respond within 24 hours.</div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={closeRetention}
                    className="w-full py-3.5 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
                  >
                    Keep My Subscription
                  </button>
                  <button
                    onClick={proceedToCancel}
                    className="w-full py-3 rounded-xl border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-500 font-semibold text-sm transition-all"
                  >
                    Cancel in Stripe &#8594;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
