'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-400', 'bg-green-500']
  const strengthLabel = ['', 'Too short', 'Good', 'Strong']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated. Sign in with your new password.')
      router.push('/login')
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
        <div className="flex justify-center mb-8">
          <Link href="/"><BrandLogo className="w-[300px] h-auto" variant="light" /></Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50">
          <div className="px-8 pt-8 pb-6 border-b border-slate-800">
            <h1 className="text-3xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              New password.
            </h1>
            <p className="text-slate-500 text-sm">Choose a strong password for your account.</p>
          </div>

          <div className="px-8 py-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Min. 8 characters"
                />
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

              <div>
                <label htmlFor="confirm" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Re-enter password"
                />
                {confirm.length > 0 && password !== confirm && (
                  <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirm || password.length < 8}
                className="w-full mt-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-px disabled:translate-y-0 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating…
                  </span>
                ) : (
                  'Set New Password →'
                )}
              </button>
            </form>
          </div>
        </div>
        <p className="text-center mt-6">
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
