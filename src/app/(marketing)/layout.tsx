'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        hamburgerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // Focus trap inside mobile menu
  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !menuRef.current) return
    const focusable = menuRef.current.querySelectorAll<HTMLElement>('a, button')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    document.addEventListener('keydown', trapFocus)
    // Focus first link in menu
    const firstLink = menuRef.current?.querySelector<HTMLElement>('a')
    firstLink?.focus()
    return () => document.removeEventListener('keydown', trapFocus)
  }, [menuOpen, trapFocus])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <BrandLogo className="w-[160px] sm:w-[200px] md:w-[240px] h-auto" variant="light" />
          </Link>

          <nav className="flex items-center gap-0.5">
            <Link
              href="/#the-moment"
              className="hidden md:block px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all"
            >
              How It Works
            </Link>
            <Link
              href="/#from-the-field"
              className="hidden md:block px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all"
            >
              From the Field
            </Link>
            <Link
              href="/#pricing"
              className="hidden md:block px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all"
            >
              Pricing
            </Link>
            <Link
              href="/support"
              className="hidden md:block px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all"
            >
              Support
            </Link>
            <Link
              href="/login"
              className="hidden sm:block px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="hidden sm:block ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/50 hover:-translate-y-px"
            >
              Get Started →
            </Link>

            {/* Mobile: CTA + hamburger */}
            <Link
              href="/signup"
              className="sm:hidden px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              Get Started
            </Link>
            <button
              ref={hamburgerRef}
              className="md:hidden ml-2 p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <line x1="4" y1="4" x2="16" y2="16" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="16" y1="4" x2="4" y2="16" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2" y="4" width="16" height="2" rx="1" fill="#94a3b8" />
                  <rect x="2" y="9" width="16" height="2" rx="1" fill="#94a3b8" />
                  <rect x="2" y="14" width="16" height="2" rx="1" fill="#94a3b8" />
                </svg>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div ref={menuRef} role="dialog" aria-label="Navigation menu" className="md:hidden border-t border-slate-800 bg-slate-950 px-4 sm:px-6 py-4 space-y-1 shadow-2xl">
            <Link
              href="/#the-moment"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              How It Works
            </Link>
            <Link
              href="/#from-the-field"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              From the Field
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              Pricing
            </Link>
            <Link
              href="/support"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              Support
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              Sign In
            </Link>
            <div className="pt-2 border-t border-slate-800 mt-2">
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all"
              >
                Get Started — $199/mo →
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1 relative z-0">{children}</main>

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
              <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
              <Link href="/sms-consent" className="hover:text-slate-400 transition-colors">SMS Terms</Link>
            </div>
            <span className="text-slate-700 text-xs">© {new Date().getFullYear()} Gurfinkel Ventures LLC. DutyProof is a product of Gurfinkel Ventures LLC.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
