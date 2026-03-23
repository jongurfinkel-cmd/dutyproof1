'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInMinutes } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { WatchWithFacility } from '@/types/database'
import toast from 'react-hot-toast'

interface WatchWithCompliance extends WatchWithFacility {
  _completed: number
  _missed: number
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return '—'
  const mins = differenceInMinutes(new Date(end), new Date(start))
  if (mins < 0) return '<1m'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

type SortKey = 'facility' | 'started' | 'duration' | 'compliance'
type SortDir = 'asc' | 'desc'

/* ── Icons ──────────────────────────────────────────────────── */

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconChevron({ className, direction = 'right' }: { className?: string; direction?: 'left' | 'right' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {direction === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  )
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconSort({ className, direction }: { className?: string; direction?: 'asc' | 'desc' | null }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 15l5 5 5-5" opacity={direction === 'desc' || !direction ? 1 : 0.25} />
      <path d="M7 9l5-5 5 5" opacity={direction === 'asc' || !direction ? 1 : 0.25} />
    </svg>
  )
}

/* ── Compliance Badge ───────────────────────────────────────── */

function ComplianceBadge({ completed, missed }: { completed: number; missed: number }) {
  const total = completed + missed
  if (total === 0) {
    return (
      <span className="text-xs text-slate-300 font-medium">Ended early</span>
    )
  }
  const pct = Math.round((completed / total) * 100)
  const color = pct === 100
    ? 'text-emerald-600 bg-emerald-50'
    : pct >= 80
      ? 'text-amber-600 bg-amber-50'
      : 'text-red-600 bg-red-50'

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold tabular-nums ${color}`}>
      {pct}%
      <span className="font-semibold text-[10px] opacity-60">{completed}/{total}</span>
    </span>
  )
}

/* ── Stats Bar ──────────────────────────────────────────────── */

function StatsBar({ watches }: { watches: WatchWithCompliance[] }) {
  const totalCheckins = watches.reduce((s, w) => s + w._completed + w._missed, 0)
  const totalCompleted = watches.reduce((s, w) => s + w._completed, 0)
  const totalMissed = watches.reduce((s, w) => s + w._missed, 0)
  const overallPct = totalCheckins > 0 ? Math.round((totalCompleted / totalCheckins) * 100) : 100
  const perfect = watches.filter((w) => {
    const t = w._completed + w._missed
    return t > 0 && w._completed === t
  }).length

  const compColor = overallPct === 100
    ? 'text-emerald-500'
    : overallPct >= 80
      ? 'text-amber-500'
      : 'text-red-500'
  const ringColor = overallPct === 100
    ? 'stroke-emerald-400'
    : overallPct >= 80
      ? 'stroke-amber-400'
      : 'stroke-red-400'

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-6">
      {/* Hero compliance ring */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 flex items-center gap-6 sm:min-w-[280px]">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              className={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - overallPct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-extrabold tabular-nums ${compColor}`}>{overallPct}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>Overall Compliance</p>
          <p className="text-xs text-slate-500 mt-0.5">{totalCompleted} of {totalCheckins} check-ins completed</p>
        </div>
      </div>

      {/* Supporting stats */}
      <div className="flex-1 grid grid-cols-3 gap-3">
        {[
          { label: 'Watches', value: String(watches.length), color: 'text-slate-800', sub: 'completed' },
          { label: 'Perfect', value: String(perfect), color: 'text-emerald-500', sub: '100% compliance' },
          { label: 'Missed', value: String(totalMissed), color: totalMissed > 0 ? 'text-red-500' : 'text-slate-800', sub: 'check-ins' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-slate-100 p-4 flex flex-col items-center justify-center text-center">
            <div className={`text-2xl font-extrabold ${s.color} tabular-nums leading-none`} style={{ fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */

export default function HistoryPage() {
  const router = useRouter()
  const [watches, setWatches] = useState<WatchWithCompliance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('started')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const PAGE_SIZE = 25

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'compliance' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  async function loadHistory(manual = false) {
    if (manual) setRefreshing(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('watches')
      .select('*, facilities(*)')
      .eq('status', 'completed')
      .order('ended_at', { ascending: false })
    if (error) { toast.error('Failed to load history'); setLoading(false); setRefreshing(false); return }
    const rawWatches = (data ?? []) as WatchWithFacility[]
    if (rawWatches.length === 0) { setWatches([]); setLoading(false); setRefreshing(false); return }

    const watchIds = rawWatches.map((w) => w.id)
    const { data: ciData } = await supabase
      .from('check_ins')
      .select('watch_id, status')
      .in('watch_id', watchIds)
      .in('status', ['completed', 'missed'])

    const ciMap = (ciData ?? []).reduce<Record<string, { completed: number; missed: number }>>((acc, ci) => {
      if (!acc[ci.watch_id]) acc[ci.watch_id] = { completed: 0, missed: 0 }
      if (ci.status === 'completed') acc[ci.watch_id].completed++
      else acc[ci.watch_id].missed++
      return acc
    }, {})

    setWatches(rawWatches.map((w) => ({
      ...w,
      _completed: ciMap[w.id]?.completed ?? 0,
      _missed: ciMap[w.id]?.missed ?? 0,
    })))
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadHistory() }, [])

  const facilityOptions = Array.from(
    new Map(watches.map((w) => [w.facilities.id, w.facilities])).values()
  )

  const filtered = watches.filter((w) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      w.facilities.name.toLowerCase().includes(q) ||
      w.assigned_name.toLowerCase().includes(q) ||
      (w.reason ?? '').toLowerCase().includes(q) ||
      (w.location ?? '').toLowerCase().includes(q)
    const matchFacility = !facilityFilter || w.facilities.id === facilityFilter
    const watchDate = new Date(w.ended_at ?? w.start_time)
    const matchFrom = !dateFrom || watchDate >= new Date(dateFrom)
    const matchTo = !dateTo || watchDate <= new Date(dateTo + 'T23:59:59')
    return matchSearch && matchFacility && matchFrom && matchTo
  })

  const filteredKey = `${search}|${facilityFilter}|${dateFrom}|${dateTo}`
  useEffect(() => { setPage(1) }, [filteredKey])

  const dir = sortDir === 'asc' ? 1 : -1
  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'facility':
        return dir * a.facilities.name.localeCompare(b.facilities.name)
      case 'started':
        return dir * (new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      case 'duration': {
        const durA = a.ended_at ? differenceInMinutes(new Date(a.ended_at), new Date(a.start_time)) : 0
        const durB = b.ended_at ? differenceInMinutes(new Date(b.ended_at), new Date(b.start_time)) : 0
        return dir * (durA - durB)
      }
      case 'compliance': {
        const totalA = a._completed + a._missed
        const totalB = b._completed + b._missed
        const pctA = totalA > 0 ? a._completed / totalA : 1
        const pctB = totalB > 0 ? b._completed / totalB : 1
        return dir * (pctA - pctB)
      }
      default:
        return 0
    }
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function downloadCSV() {
    try {
      const headers = ['Job Site', 'Location', 'Fire Watcher', 'Phone', 'Started', 'Ended', 'Duration', 'Compliance %', 'Completed', 'Missed', 'Reason']
      const rows = sorted.map((w) => {
        const total = w._completed + w._missed
        const pct = total > 0 ? Math.round((w._completed / total) * 100) : 100
        return [
          w.facilities.name,
          w.location ?? '',
          w.assigned_name,
          w.assigned_phone,
          w.start_time ? new Date(w.start_time).toLocaleString() : '',
          w.ended_at ? new Date(w.ended_at).toLocaleString() : '',
          formatDuration(w.start_time, w.ended_at),
          `${pct}%`,
          w._completed,
          w._missed,
          w.reason ?? '',
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      })
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dutyproof-history-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to generate CSV. Please try again.')
    }
  }

  const hasActiveFilters = search || facilityFilter || dateFrom || dateTo
  function clearFilters() {
    setSearch('')
    setFacilityFilter('')
    setDateFrom('')
    setDateTo('')
    setDateFilterOpen(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-200">
              <IconClipboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-xl sm:text-2xl text-slate-900 leading-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                Watch History
              </h2>
              {!loading && (
                <p className="text-slate-500 text-xs mt-0.5">
                  {watches.length} completed watch{watches.length !== 1 ? 'es' : ''}
                  {filtered.length !== watches.length && (
                    <span className="text-blue-500 ml-1">&bull; {filtered.length} shown</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sorted.length > 0 && (
              <button
                onClick={downloadCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-100 bg-white text-slate-500
                  hover:text-slate-700 hover:border-slate-200 hover:bg-slate-50 text-xs font-bold transition-all duration-200"
              >
                <IconDownload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
            <button
              onClick={() => loadHistory(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-100 bg-white text-slate-500
                hover:text-slate-700 hover:border-slate-200 hover:bg-slate-50 text-xs font-bold transition-all duration-200
                disabled:opacity-40"
            >
              <IconRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* ── Loading ───────────────────────────────────── */}
        {loading ? (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border-2 border-slate-100 p-3.5 animate-pulse">
                  <div className="h-6 w-12 bg-slate-100 rounded-lg mx-auto mb-1" />
                  <div className="h-3 w-20 bg-slate-50 rounded-lg mx-auto" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border-2 border-slate-100 rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100" />
                    <div className="flex-1">
                      <div className="h-4 w-36 bg-slate-100 rounded-lg mb-2" />
                      <div className="h-3 w-52 bg-slate-50 rounded-lg" />
                    </div>
                    <div className="h-8 w-20 bg-slate-100 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : watches.length === 0 ? (
          /* ── Empty State ──────────────────────────────── */
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
              <IconClipboard className="w-8 h-8 text-slate-300" />
            </div>
            <h3
              className="text-lg text-slate-700 mb-2"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              No completed watches yet
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              When you end a fire watch, it will appear here with the full compliance audit trail.
            </p>
          </div>
        ) : (
          <>
            {/* ── Stats ─────────────────────────────────── */}
            <StatsBar watches={watches} />

            {/* ── Search & Filters ──────────────────────── */}
            <div className="mb-5 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by job site, watcher, or reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl text-sm text-slate-900 bg-white
                      placeholder:text-slate-300
                      focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50
                      transition-all duration-200"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                      <IconX className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>
                {facilityOptions.length > 1 && (
                  <select
                    value={facilityFilter}
                    onChange={(e) => setFacilityFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-slate-100 rounded-xl text-sm bg-white text-slate-600
                      focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50
                      transition-all duration-200 sm:w-48"
                  >
                    <option value="">All job sites</option>
                    {facilityOptions.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date range */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setDateFilterOpen((o) => {
                      if (o) { setDateFrom(''); setDateTo('') }
                      return !o
                    })
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border-2 transition-all duration-200 ${
                    dateFrom || dateTo
                      ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-500'
                  }`}
                >
                  <IconCalendar className="w-3.5 h-3.5" />
                  {dateFrom || dateTo
                    ? `${dateFrom || '...'} \u2192 ${dateTo || '...'}`
                    : 'Date range'}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                  >
                    <IconX className="w-3 h-3" />
                    Clear filters
                  </button>
                )}
              </div>

              {dateFilterOpen && (
                <div className="flex flex-col sm:flex-row gap-3 bg-white border-2 border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="flex-1 px-3 py-2.5 border-2 border-slate-100 rounded-xl text-sm text-slate-900 bg-white
                        focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="flex-1 px-3 py-2.5 border-2 border-slate-100 rounded-xl text-sm text-slate-900 bg-white
                        focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── No results ────────────────────────────── */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-slate-100">
                <IconSearch className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-3">No watches match your filters.</p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-500 text-sm font-bold transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                {/* ── Sort Controls (mobile) ─────────────── */}
                <div className="flex items-center gap-2 mb-3 sm:hidden">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
                  {(['started', 'compliance', 'facility'] as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        sortKey === key
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'text-slate-400 hover:text-slate-600 border border-transparent'
                      }`}
                    >
                      {key === 'started' ? 'Date' : key === 'compliance' ? 'Score' : 'Site'}
                      {sortKey === key && (
                        <span className="ml-0.5">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Desktop Table ──────────────────────── */}
                <div className="hidden sm:block bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-100/60">
                          {([
                            { key: 'facility' as SortKey, label: 'Job Site' },
                            { key: null, label: 'Fire Watcher' },
                            { key: 'started' as SortKey, label: 'Started' },
                            { key: 'duration' as SortKey, label: 'Duration' },
                            { key: 'compliance' as SortKey, label: 'Compliance' },
                          ]).map(({ key, label }) => (
                            <th
                              key={label}
                              className={`text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] select-none ${
                                key ? 'cursor-pointer text-slate-400 hover:text-slate-600 transition-colors' : 'text-slate-400'
                              }`}
                              onClick={key ? () => handleSort(key) : undefined}
                            >
                              <span className="inline-flex items-center gap-1">
                                {label}
                                {key && (
                                  <IconSort
                                    className="w-3 h-3"
                                    direction={sortKey === key ? sortDir : null}
                                  />
                                )}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((w, i) => (
                          <tr
                            key={w.id}
                            onClick={() => router.push(`/watches/${w.id}`)}
                            className={`group cursor-pointer transition-colors duration-150 ${
                              i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                            } hover:bg-blue-50/50`}
                          >
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-800 text-[13px] group-hover:text-blue-600 transition-colors">{w.facilities.name}</div>
                              {w.location && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                  <IconMapPin className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate max-w-[180px]">{w.location}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-slate-600 text-[13px]">{w.assigned_name}</span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 text-[13px] whitespace-nowrap">
                              {format(new Date(w.start_time), 'MMM d, h:mm a')}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-[13px]">
                              {formatDuration(w.start_time, w.ended_at)}
                            </td>
                            <td className="px-5 py-3.5">
                              <ComplianceBadge completed={w._completed} missed={w._missed} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav className="flex items-center justify-between px-5 py-3.5 border-t-2 border-slate-50" aria-label="Pagination">
                      <span className="text-xs font-medium text-slate-400">
                        {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:text-slate-200 disabled:hover:bg-transparent transition-colors"
                        >
                          <IconChevron className="w-4 h-4" direction="left" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                          .reduce<(number | 'dots')[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('dots')
                            acc.push(p)
                            return acc
                          }, [])
                          .map((p, i) =>
                            p === 'dots' ? (
                              <span key={`d-${i}`} className="px-1 text-xs text-slate-300">&hellip;</span>
                            ) : (
                              <button
                                key={p}
                                onClick={() => setPage(p as number)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                                  page === p
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                    : 'text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                {p}
                              </button>
                            )
                          )}
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:text-slate-200 disabled:hover:bg-transparent transition-colors"
                        >
                          <IconChevron className="w-4 h-4" direction="right" />
                        </button>
                      </div>
                    </nav>
                  )}
                </div>

                {/* ── Mobile Cards ───────────────────────── */}
                <div className="sm:hidden space-y-2.5">
                  {paginated.map((w) => {
                    const total = w._completed + w._missed
                    const pct = total > 0 ? Math.round((w._completed / total) * 100) : -1
                    const accentColor = pct === 100
                      ? 'border-l-emerald-400'
                      : pct >= 80
                        ? 'border-l-amber-400'
                        : pct >= 0
                          ? 'border-l-red-400'
                          : 'border-l-slate-200'
                    return (
                      <Link
                        key={w.id}
                        href={`/watches/${w.id}`}
                        className={`block bg-white rounded-xl border border-slate-100 border-l-[3px] ${accentColor} px-4 py-3.5 active:bg-slate-50 transition-colors`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-800 text-[13px] truncate">{w.facilities.name}</h3>
                            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-1">
                              <span>{w.assigned_name}</span>
                              <span className="text-slate-200">&middot;</span>
                              <span>{formatDuration(w.start_time, w.ended_at)}</span>
                              <span className="text-slate-200">&middot;</span>
                              <span>{format(new Date(w.start_time), 'MMM d')}</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {pct >= 0 ? (
                              <span className={`text-base font-extrabold tabular-nums ${
                                pct === 100 ? 'text-emerald-500' : pct >= 80 ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {pct}%
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-300">—</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}

                  {/* Mobile Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 disabled:text-slate-200 transition-colors"
                      >
                        <IconChevron className="w-3.5 h-3.5" direction="left" />
                        Prev
                      </button>
                      <span className="text-xs font-medium text-slate-400">
                        {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 disabled:text-slate-200 transition-colors"
                      >
                        Next
                        <IconChevron className="w-3.5 h-3.5" direction="right" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
