'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'
import toast from 'react-hot-toast'

function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Check your email to verify, then set up your subscription.', { duration: 6000 })
      router.push('/billing')
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-400', 'bg-green-500']
  const strengthLabel = ['', 'Too short', 'Good', 'Strong']

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
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
        <Link href="/" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-sm transition-colors mb-8">
          ← Back to home
        </Link>

        <div className="flex justify-center mb-8">
          <Link href="/"><BrandLogo className="w-[300px] h-auto" variant="light" /></Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-800">
            <h1 className="text-3xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Protect your job site.
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm font-semibold">✓ $199/mo · Unlimited sites</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500 text-sm">Cancel any time</span>
            </div>
          </div>

          {/* What you get */}
          <div className="px-8 py-5 border-b border-slate-800 space-y-2">
            {[
              'Automated SMS check-ins — no app for workers',
              'Missed check-in alerts in under 60 seconds',
              'One-click PDF compliance reports',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-xs text-slate-400">
                <span className="text-blue-500 font-bold flex-shrink-0">✓</span>
                {item}
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <form onSubmit={handleSignup} className="space-y-4">
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
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-11 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-slate-700'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-semibold ${
                      strength === 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (password.length > 0 && password.length < 8)}
                className="w-full mt-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-px disabled:translate-y-0 text-sm active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    Creating account…
                  </span>
                ) : (
                  'Create Account →'
                )}
              </button>
              <p className="text-center text-slate-600 text-xs mt-3">
                Secured by Stripe · Cancel any time
              </p>
              <p className="text-center text-slate-700 text-xs mt-2">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">Privacy Policy</Link>.
              </p>
            </form>

            <p className="text-center text-sm text-slate-600 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-5">
          $199/month flat rate · Cancel any time · 30-day money-back guarantee
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <SignupForm />
}
