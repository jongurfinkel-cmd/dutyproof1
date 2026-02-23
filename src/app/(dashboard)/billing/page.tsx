'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const includedFeatures = [
  'Unlimited active watches per facility',
  'Automated SMS check-ins (15 or 30 min intervals)',
  'Missed check-in escalation in < 60 seconds',
  'Tamper-proof immutable audit log',
  'One-click CMS-ready PDF reports',
  'Searchable watch history',
  'Unlimited admin & supervisor accounts',
  'Direct email & chat support',
]

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  async function startCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('No billing account found. Please start your trial first.')
        setPortalLoading(false)
      }
    } catch {
      setPortalLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          Start your 14-day free trial
        </h1>
        <p className="text-slate-500">
          Full access to DutyProof. Cancel any time before the trial ends — no charge.
        </p>
      </div>

      <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white overflow-hidden shadow-2xl shadow-blue-100 mb-6">
        <div className="bg-blue-700 px-8 py-8 text-center">
          <div className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-3">Per Facility</div>
          <div className="flex items-end justify-center gap-1 mb-1">
            <span className="text-7xl font-extrabold text-white">$149</span>
            <div className="text-blue-200 text-base mb-3 text-left leading-snug">/facility<br />/month</div>
          </div>
          <p className="text-blue-200 text-sm">14-day free trial · Credit card required · Cancel any time</p>
        </div>

        <div className="px-8 py-8">
          <div className="grid grid-cols-1 gap-y-2.5 mb-8">
            {includedFeatures.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</div>
                <span className="text-slate-700 text-sm">{f}</span>
              </div>
            ))}
          </div>

          <button
            onClick={startCheckout}
            disabled={loading}
            className="w-full py-4 px-8 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:bg-slate-300 text-white font-bold text-base shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecting to checkout…
              </span>
            ) : (
              'Start 14-Day Free Trial →'
            )}
          </button>
          <p className="text-center text-slate-500 text-xs mt-3">
            Secured by Stripe · Cancel any time before trial ends
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-slate-500 text-sm mb-2">Already have an active subscription?</p>
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="text-blue-600 hover:text-blue-700 text-sm font-semibold underline underline-offset-2 transition-colors"
        >
          {portalLoading ? 'Loading…' : 'Manage billing →'}
        </button>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>
    </div>
  )
}
