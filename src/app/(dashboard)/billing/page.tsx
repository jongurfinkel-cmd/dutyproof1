'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const includedFeatures = [
  'Unlimited job sites',
  'Unlimited active watches',
  'Automated SMS check-ins (any interval)',
  'Missed check-in escalation in < 60 seconds',
  'Tamper-proof immutable audit log',
  'One-click OSHA-ready PDF reports',
  'Searchable watch history',
  'Direct email & phone support',
]

type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | null

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [annualLoading, setAnnualLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [subStatus, setSubStatus] = useState<SubStatus | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function loadStatus() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, is_admin')
        .eq('id', user.id)
        .single()
      setSubStatus((profile?.subscription_status as SubStatus) ?? null)
      setIsAdmin(profile?.is_admin ?? false)
    }
    loadStatus()
  }, [])

  async function startCheckout(annual?: boolean) {
    if (annual) setAnnualLoading(true)
    else setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annual: !!annual }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        setAnnualLoading(false)
        return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Something went wrong. Please try again.')
        setLoading(false)
        setAnnualLoading(false)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
      setAnnualLoading(false)
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

  const isActive = subStatus === 'trialing' || subStatus === 'active'
  const isPastDue = subStatus === 'past_due' || subStatus === 'unpaid'
  const isCanceled = subStatus === 'canceled'
  const statusLoading = subStatus === undefined

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
            ← Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="text-center mb-10">
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 mb-2">
          {isActive ? 'Your Plan' : isCanceled ? 'Reactivate DutyProof' : 'Subscribe to DutyProof'}
        </h1>
        <p className="text-slate-500">
          {isActive
            ? 'Full access to DutyProof. Manage or cancel any time.'
            : isCanceled
            ? 'Your subscription has ended. Subscribe again to resume access.'
            : isPastDue
            ? 'There\'s an issue with your payment — update to keep watches running.'
            : 'Unlimited sites. Unlimited watches. One flat price.'}
        </p>
      </div>

      {/* Active state */}
      {isActive && (
        <div className="rounded-3xl border-2 border-green-200 bg-gradient-to-b from-green-50 to-white overflow-hidden shadow-xl shadow-green-100 mb-6">
          <div className="bg-green-700 px-4 py-6 sm:px-8 sm:py-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold tracking-widest uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              {subStatus === 'trialing' ? 'Free Trial Active' : 'Subscription Active'}
            </div>
            <p className="text-green-200 text-sm mt-1">
              {subStatus === 'trialing'
                ? 'Your trial is active. Subscribe to keep access when it ends.'
                : '$199/month · Unlimited sites · Cancel any time'}
            </p>
          </div>
          <div className="px-4 py-6 sm:px-8 sm:py-8 text-center">
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="w-full py-4 px-8 rounded-xl bg-green-700 hover:bg-green-600 disabled:bg-slate-300 text-white font-bold text-base shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
            >
              {portalLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading…
                </span>
              ) : (
                'Manage Billing →'
              )}
            </button>
            <p className="text-center text-slate-500 text-xs mt-3">
              Update payment method · View invoices · Cancel subscription
            </p>
          </div>
        </div>
      )}

      {/* Past due state */}
      {isPastDue && (
        <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white overflow-hidden shadow-xl shadow-amber-100 mb-6">
          <div className="bg-amber-600 px-4 py-6 sm:px-8 sm:py-8 text-center">
            <div className="text-white font-black text-xl mb-1">Payment Failed</div>
            <p className="text-amber-100 text-sm">SMS check-ins may be paused until resolved.</p>
          </div>
          <div className="px-4 py-6 sm:px-8 sm:py-8 text-center">
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="w-full py-4 px-8 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white font-bold text-base shadow-lg transition-all hover:-translate-y-0.5 disabled:translate-y-0"
            >
              {portalLoading ? 'Loading…' : 'Update Payment Method →'}
            </button>
          </div>
        </div>
      )}

      {/* New subscription state */}
      {(subStatus === null || isCanceled || statusLoading) && (
        <div className={`space-y-6 ${statusLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Monthly plan */}
          <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white overflow-hidden shadow-2xl shadow-blue-100">
            <div className="bg-blue-700 px-4 py-6 sm:px-8 sm:py-8 text-center">
              <div className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-3">Flat Rate — Unlimited Sites</div>
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
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</div>
                    <span className="text-slate-700 text-sm">{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => startCheckout(false)}
                disabled={loading || annualLoading || statusLoading}
                className="w-full py-4 px-8 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:bg-slate-300 text-white font-bold text-base shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redirecting to checkout…
                  </span>
                ) : (
                  'Subscribe Monthly — $199/mo →'
                )}
              </button>
              <p className="text-center text-slate-500 text-xs mt-3">
                Secured by Stripe · Cancel any time
              </p>
            </div>
          </div>

          {/* Annual plan */}
          <div className="rounded-3xl border-2 border-green-200 bg-gradient-to-b from-green-50 to-white overflow-hidden shadow-xl shadow-green-100 relative">
            <div className="bg-green-700 px-4 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8 text-center relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg z-10">
                Lock in your rate
              </div>
              <div className="text-green-200 text-xs font-bold tracking-widest uppercase mb-3">Annual Commitment</div>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white">$2,399</span>
                <div className="text-green-200 text-base mb-3">/year</div>
              </div>
              <p className="text-green-200 text-sm">Same plan. One bill, locked rate for 12 months.</p>
            </div>

            <div className="px-4 py-6 sm:px-8 sm:py-8 text-center">
              <button
                onClick={() => startCheckout(true)}
                disabled={loading || annualLoading || statusLoading}
                className="w-full py-4 px-8 rounded-xl bg-green-700 hover:bg-green-600 disabled:bg-slate-300 text-white font-bold text-base shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
              >
                {annualLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redirecting to checkout…
                  </span>
                ) : (
                  'Subscribe Annually — $2,399/yr →'
                )}
              </button>
              <p className="text-center text-slate-500 text-xs mt-3">
                Secured by Stripe · Billed once per year
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
          ← Back to dashboard
        </button>
      </div>
    </div>
  )
}
