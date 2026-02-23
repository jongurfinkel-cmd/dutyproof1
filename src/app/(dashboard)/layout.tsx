'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [criticalCount, setCriticalCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`)
      } else {
        setUserEmail(data.user.email ?? null)
      }
    })
  }, [router, pathname])

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    async function loadCriticalCount() {
      const supabase = createClient()
      const { data: activeWatches } = await supabase
        .from('watches')
        .select('id')
        .eq('status', 'active')
      if (!activeWatches?.length) { setCriticalCount(0); return }
      const watchIds = activeWatches.map((w) => w.id)
      const [{ data: missed }, { data: expiredPending }] = await Promise.all([
        supabase.from('check_ins').select('watch_id').in('watch_id', watchIds).eq('status', 'missed'),
        supabase.from('check_ins').select('watch_id').in('watch_id', watchIds).eq('status', 'pending').lt('token_expires_at', new Date().toISOString()),
      ])
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

  const navLinks = [
    { href: '/dashboard', label: 'Active Watches', badge: criticalCount },
    { href: '/history', label: 'Watch History', badge: 0 },
    { href: '/facilities', label: 'Facilities', badge: 0 },
  ]
  const isNewWatch = pathname === '/watches/new'

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed+off-screen on mobile, static in flow on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 bg-slate-950 text-white flex flex-col shrink-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-6 border-b border-slate-800/60">
          <Link href="/dashboard">
            <BrandLogo className="w-[180px] h-auto" variant="light" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5">
          <Link
            href="/watches/new"
            className={`flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-bold transition-all mb-3 ${
              isNewWatch
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30'
            }`}
          >
            + Start New Watch
          </Link>
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                {link.badge > 0 && (
                  <span className="ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-5 border-t border-slate-800/60">
          <p className="text-xs text-slate-500 truncate mb-3">{userEmail}</p>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="2" y="4" width="16" height="2" rx="1" fill="#475569" />
              <rect x="2" y="9" width="16" height="2" rx="1" fill="#475569" />
              <rect x="2" y="14" width="16" height="2" rx="1" fill="#475569" />
            </svg>
          </button>
          <BrandLogo className="w-[160px] h-auto" />
          {criticalCount > 0 && (
            <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {criticalCount > 9 ? '9+' : criticalCount}
            </span>
          )}
        </header>

        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
