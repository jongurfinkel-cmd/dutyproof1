'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'

/* ── Icons ──────────────────────────────────────────────────── */

function IconFire({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" strokeWidth={2} />
    </svg>
  )
}

function IconCreditCard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function IconLogOut({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

/* ── Main Layout ────────────────────────────────────────────── */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [criticalCount, setCriticalCount] = useState(0)
  const sidebarRef = useRef<HTMLElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? null)
        const meta = data.user.user_metadata as Record<string, string> | undefined
        setUserDisplayName(meta?.full_name ?? null)
      } else {
        router.push('/login')
      }
    })
  }, [])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    if (!sidebarOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
        hamburgerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !sidebarRef.current) return
    const focusable = sidebarRef.current.querySelectorAll<HTMLElement>('a, button')
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
    if (!sidebarOpen) return
    document.addEventListener('keydown', trapFocus)
    const firstLink = sidebarRef.current?.querySelector<HTMLElement>('a')
    firstLink?.focus()
    return () => document.removeEventListener('keydown', trapFocus)
  }, [sidebarOpen, trapFocus])

  useEffect(() => {
    async function loadCriticalCount() {
      const supabase = createClient()
      const { data: activeWatches } = await supabase
        .from('watches')
        .select('id')
        .eq('status', 'active')
      if (!activeWatches?.length) { setCriticalCount(0); return }
      const watchIds = activeWatches.map((w) => w.id)
      const [{ data: missed, error: missedErr }, { data: expiredPending, error: expiredErr }] = await Promise.all([
        supabase.from('check_ins').select('watch_id').in('watch_id', watchIds).eq('status', 'missed'),
        supabase.from('check_ins').select('watch_id').in('watch_id', watchIds).eq('status', 'pending').lt('token_expires_at', new Date().toISOString()),
      ])
      if (missedErr || expiredErr) {
        console.error('Critical count query error:', missedErr ?? expiredErr)
      }
      const ids = new Set([
        ...(missed ?? []).map((c) => c.watch_id),
        ...(expiredPending ?? []).map((c) => c.watch_id),
      ])
      setCriticalCount(ids.size)
    }
    loadCriticalCount()
    const interval = setInterval(loadCriticalCount, 60_000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLinks: { href: string; label: string; icon: typeof IconFire; badge: number }[] = [
    { href: '/dashboard', label: 'Active Watches', icon: IconFire, badge: criticalCount },
    { href: '/history', label: 'Watch History', icon: IconClipboard, badge: 0 },
    { href: '/facilities', label: 'Job Sites', icon: IconBuilding, badge: 0 },
    { href: '/billing', label: 'Billing', icon: IconCreditCard, badge: 0 },
  ]

  const initials = userDisplayName
    ? userDisplayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail
      ? userEmail.charAt(0).toUpperCase()
      : '?'

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-30 w-[240px] flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <Link href="/dashboard" className="block">
            <BrandLogo className="w-[150px] h-auto" variant="light" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-2 pb-4 flex flex-col" aria-label="Main navigation">
          {/* New Watch CTA */}
          <Link
            href="/watches/new"
            className="flex items-center justify-center gap-2 mx-1 mb-4 px-3 py-2.5 rounded-xl text-[13px] font-bold
              bg-gradient-to-r from-blue-600 to-blue-500 text-white
              shadow-lg shadow-blue-500/20
              hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5
              transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Watch
          </Link>

          {/* Watches group */}
          <p className="px-3 mb-1.5 text-[9px] font-bold text-slate-500/60 uppercase tracking-[0.15em]">Watches</p>
          <div className="space-y-0.5">
            {navLinks.slice(0, 2).map((link) => {
              const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 relative ${
                    active
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-orange-400" />
                  )}
                  <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    active ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`} />
                  <span className="flex-1">{link.label}</span>
                  {link.badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center leading-none shadow-lg shadow-red-500/30">
                      {link.badge > 9 ? '9+' : link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Manage group */}
          <p className="px-3 mt-5 mb-1.5 text-[9px] font-bold text-slate-500/60 uppercase tracking-[0.15em]">Manage</p>
          <div className="space-y-0.5">
            {navLinks.slice(2).map((link) => {
              const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 relative ${
                    active
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-orange-400" />
                  )}
                  <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    active ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`} />
                  <span className="flex-1">{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />
        </nav>

        {/* User section */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <span className="text-white text-xs font-extrabold">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-slate-200 font-semibold truncate">{userDisplayName || userEmail}</p>
              {userDisplayName && (
                <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
              title="Sign out"
            >
              <IconLogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
          <button
            ref={hamburgerRef}
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <IconMenu className="w-5 h-5 text-slate-600" />
          </button>
          <BrandLogo className="w-[130px] h-auto" />
          {criticalCount > 0 && (
            <span className="ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-lg shadow-red-200">
              {criticalCount > 9 ? '9+' : criticalCount}
            </span>
          )}
        </header>

        <main className="flex-1 min-w-0 min-h-0 overflow-auto relative z-0">
          {children}
        </main>
      </div>
    </div>
  )
}
