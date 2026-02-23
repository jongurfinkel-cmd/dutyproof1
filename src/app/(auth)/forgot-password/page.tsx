'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        <Link href="/login" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-sm transition-colors mb-8">
          ← Back to sign in
        </Link>

        <div className="flex justify-center mb-8">
          <Link href="/"><BrandLogo className="w-[300px] h-auto" variant="light" /></Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50">
          <div className="px-8 pt-8 pb-6 border-b border-slate-800">
            <h1 className="text-3xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Reset password.
            </h1>
            <p className="text-slate-500 text-sm">Enter your email and we&apos;ll send a reset link.</p>
          </div>

          <div className="px-8 py-7">
            {sent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-900/40 border-2 border-green-600 flex items-center justify-center">
                  <span className="text-green-400 text-2xl font-bold">✓</span>
                </div>
                <p className="text-white font-bold mb-2">Check your email</p>
                <p className="text-slate-400 text-sm mb-6">
                  We sent a reset link to <span className="text-slate-200 font-medium">{email}</span>.
                  It expires in 1 hour.
                </p>
                <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
                  ← Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="you@facility.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-px disabled:translate-y-0 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    'Send Reset Link →'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
