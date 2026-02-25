'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'

const LAUNCH_DATE = new Date('2026-03-02T09:00:00-05:00')

function LaunchCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, launched: false })

  useEffect(() => {
    function calc() {
      const diff = LAUNCH_DATE.getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, launched: true })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        launched: false,
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])

  if (timeLeft.launched) {
    return (
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-5 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl sm:text-2xl font-black tracking-tight">🚀 DutyProof is Live!</p>
          <p className="text-blue-200 text-sm mt-1">Start your free trial today →</p>
        </div>
      </div>
    )
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="relative bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800 text-white py-5 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">

        {/* Left: label */}
        <div className="text-center sm:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300 mb-0.5">Official Launch</p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none">March 2<sup className="text-lg">nd</sup>, 2026</p>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-14 bg-white/20" />

        {/* Countdown boxes */}
        <div className="flex items-center gap-3">
          {[
            { label: 'Days', value: pad(timeLeft.days) },
            { label: 'Hours', value: pad(timeLeft.hours) },
            { label: 'Min', value: pad(timeLeft.minutes) },
            { label: 'Sec', value: pad(timeLeft.seconds) },
          ].map(({ label, value }, i) => (
            <div key={label}>
              <div className="bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-center min-w-[52px]">
                <div className="text-2xl sm:text-3xl font-black tabular-nums leading-none">{value}</div>
                <div className="text-[9px] uppercase tracking-widest text-blue-300 mt-1">{label}</div>
              </div>
              {i < 3 && <span className="text-blue-300 font-bold text-xl ml-3">:</span>}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-14 bg-white/20" />

        {/* CTA */}
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-800 text-sm font-black rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-black/20 hover:scale-105 active:scale-100 whitespace-nowrap"
        >
          Get Early Access →
        </Link>
      </div>
    </div>
  )
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Launch Announcement ── */}
      <LaunchCountdown />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <BrandLogo className="w-[200px] sm:w-[280px] md:w-[340px] h-auto" variant="dark" />
          </Link>

          <nav className="flex items-center gap-0.5">
            <Link
              href="/#the-moment"
              className="hidden md:block px-3.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-all"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="hidden md:block px-3.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-all"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="hidden sm:block px-3.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="hidden sm:block ml-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-200/70 hover:-translate-y-px"
            >
              Free Trial →
            </Link>

            {/* Mobile: CTA + hamburger */}
            <Link
              href="/signup"
              className="sm:hidden px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-all"
            >
              Free Trial
            </Link>
            <button
              className="md:hidden ml-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <line x1="4" y1="4" x2="16" y2="16" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                  <line x1="16" y1="4" x2="4" y2="16" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2" y="4" width="16" height="2" rx="1" fill="#475569" />
                  <rect x="2" y="9" width="16" height="2" rx="1" fill="#475569" />
                  <rect x="2" y="14" width="16" height="2" rx="1" fill="#475569" />
                </svg>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 sm:px-6 py-4 space-y-1 shadow-lg">
            <Link
              href="/#the-moment"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Pricing
            </Link>
            <Link
              href="/support"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Support
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Sign In
            </Link>
            <div className="pt-2 border-t border-slate-100 mt-2">
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center px-4 py-3 bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all"
              >
                Start 60-Day Free Trial →
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 relative z-0">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <BrandLogo className="w-[160px] sm:w-[200px] h-auto" variant="light" />
              <span className="text-slate-600 text-sm hidden sm:inline">— Fire watch compliance, automated.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/support" className="hover:text-slate-300 transition-colors">Support</Link>
              <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-slate-300 transition-colors">Get Started</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-5 text-xs text-slate-600">
              <Link href="/security" className="hover:text-slate-400 transition-colors">Security</Link>
              <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            </div>
            <span className="text-slate-700 text-xs">© {new Date().getFullYear()} DutyProof</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
