'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function SmsConfirmPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'idle' | 'confirming' | 'confirmed' | 'error' | 'already'>('idle')

  async function confirm() {
    setStatus('confirming')
    try {
      const res = await fetch('/api/sms/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'already_confirmed') {
          setStatus('already')
        } else {
          setStatus('error')
        }
        return
      }
      setStatus('confirmed')
    } catch {
      setStatus('error')
    }
  }

  // ─── Confirmed ───
  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-900/50 border-2 border-green-700 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-xl text-white font-extrabold mb-2">SMS Confirmed</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            You will now receive fire watch check-in reminders via text message. Reply <strong className="text-slate-300">STOP</strong> at any time to opt out.
          </p>
          <p className="text-slate-500 text-xs">You can close this page.</p>
        </div>
      </div>
    )
  }

  // ─── Already confirmed ───
  if (status === 'already') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-900/50 border-2 border-blue-700 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-xl text-white font-extrabold mb-2">Already Confirmed</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            You already confirmed SMS consent for this watch. Check-in reminders are active.
          </p>
        </div>
      </div>
    )
  }

  // ─── Error ───
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-900/50 border-2 border-red-700 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 className="text-xl text-white font-extrabold mb-2">Something Went Wrong</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            This consent link may have expired or the watch may have ended. Contact your supervisor for a new link.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ─── Default: consent form ───
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 px-6 py-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <h1 className="text-lg text-white font-extrabold">Confirm SMS Notifications</h1>
          <p className="text-blue-100 text-sm mt-1">
            Your supervisor has assigned you to a fire watch
          </p>
        </div>

        {/* Consent details */}
        <div className="px-6 py-5 space-y-4 text-left">
          <div>
            <h3 className="text-white font-semibold text-sm mb-2">By tapping &ldquo;I Agree,&rdquo; you consent to receive:</h3>
            <ul className="space-y-1.5">
              {[
                'Check-in reminder texts with a tap-to-verify link',
                'Missed check-in follow-up alerts',
                'Watch summary when your shift ends',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-400 text-xs">
                  <span className="text-blue-400 mt-0.5 flex-shrink-0">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800 rounded-xl p-3 space-y-1.5 text-xs text-slate-500">
            <p><strong className="text-slate-400">From:</strong> DutyProof (Gurfinkel Ventures LLC)</p>
            <p><strong className="text-slate-400">Frequency:</strong> Varies by watch schedule (typically every 15-60 min during active watch)</p>
            <p><strong className="text-slate-400">Cost:</strong> Msg &amp; data rates may apply</p>
            <p><strong className="text-slate-400">Opt-out:</strong> Reply STOP to any message at any time</p>
            <p><strong className="text-slate-400">Help:</strong> Reply HELP or email support@dutyproof.com</p>
          </div>

          <p className="text-slate-500 text-xs leading-relaxed">
            Consent is <strong className="text-slate-400">not required</strong> to use DutyProof. Your supervisor can share check-in links via email or QR code instead. See our{' '}
            <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link> and{' '}
            <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>.
          </p>

          <button
            onClick={confirm}
            disabled={status === 'confirming'}
            className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-bold text-sm transition-all active:scale-[0.98]"
          >
            {status === 'confirming' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirming&hellip;
              </span>
            ) : (
              'I Agree \u2014 Send Me Check-In Reminders'
            )}
          </button>

          <p className="text-center text-slate-600 text-[11px]">
            You can opt out at any time by replying STOP to any message.
          </p>
        </div>
      </div>
    </div>
  )
}
