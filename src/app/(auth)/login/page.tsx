'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'

/* ── Icons ──────────────────────────────────────────────────── */

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
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

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function IconAlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

/* ── Login Form ─────────────────────────────────────────────── */

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      const next = searchParams.get('next')
      const isSafeRedirect = next && next.startsWith('/') && !next.startsWith('//') && !next.includes(':')
      router.push(isSafeRedirect ? next : '/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(ellipse, #ea580c 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-[420px]">
        {/* Logo — centered above card */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="block">
            <BrandLogo className="w-[180px] h-auto mx-auto block" variant="light" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/95 border border-slate-800/80 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 sm:px-10 pt-9 pb-7 text-center">
            <h1
              className="text-2xl text-white leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Welcome back
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">Sign in to your fire watch dashboard</p>
          </div>

          {/* Form */}
          <div className="px-8 sm:px-10 pb-9">
            <form onSubmit={handleLogin} className="space-y-5" noValidate method="post" action="/login">
              <div>
                <label htmlFor="email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  required
                  autoComplete="username email"
                  autoFocus
                  className="w-full px-4 py-3.5 bg-slate-800/60 border-2 border-slate-700/60 rounded-xl text-white text-sm
                    placeholder:text-slate-600
                    focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                    transition-all duration-200"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em]">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null) }}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 pr-12 bg-slate-800/60 border-2 border-slate-700/60 rounded-xl text-white text-sm
                      placeholder:text-slate-600
                      focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                      transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <IconEyeOff className="w-4 h-4" />
                    ) : (
                      <IconEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20" role="alert">
                  <IconAlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-red-400 text-xs font-medium">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-4 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500
                  text-white font-bold rounded-xl text-sm
                  shadow-lg shadow-blue-600/20 disabled:shadow-none
                  transition-all duration-200
                  hover:-translate-y-0.5 disabled:translate-y-0
                  active:scale-[0.98]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <IconArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
                >
                  Create one free
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="flex justify-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-xs font-medium transition-colors group"
          >
            <IconArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
