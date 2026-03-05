'use client'

import { useEffect, useState } from 'react'
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
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

type SortKey = 'facility' | 'started' | 'duration' | 'compliance'
type SortDir = 'asc' | 'desc'

export default function HistoryPage() {
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

  // Unique facilities for filter dropdown
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

  // Reset to page 1 whenever filters change
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

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-10">
        <h2
          className="text-xl sm:text-3xl text-slate-900 mb-8"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
        >
          Watch History
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white border border-slate-200 animate-pulse rounded-xl shadow-sm" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2
            className="text-xl sm:text-3xl text-slate-900"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Watch History
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {watches.length} completed watch{watches.length !== 1 ? 'es' : ''}
            {filtered.length !== watches.length && ` · ${filtered.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sorted.length > 0 && (
            <button
              onClick={downloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1v9M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export CSV
            </button>
          )}
          <button
            onClick={() => loadHistory(true)}
            disabled={refreshing}
            aria-label="Refresh history"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold transition-all disabled:opacity-40 shadow-sm"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              className={refreshing ? 'animate-spin' : ''}
              aria-hidden="true"
            >
              <path d="M13.65 2.35A8 8 0 1 0 15 8h-2a6 6 0 1 1-1.05-3.4L9 7h6V1l-1.35 1.35z" fill="currentColor" />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search + filter */}
      {watches.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by job site, worker, or reason…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {facilityOptions.length > 1 && (
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All job sites</option>
                {facilityOptions.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <button
              onClick={() => {
                setDateFilterOpen((o) => {
                  if (o) { setDateFrom(''); setDateTo('') }
                  return !o
                })
              }}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                dateFrom || dateTo
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {dateFrom || dateTo
                ? `${dateFrom || '…'} → ${dateTo || '…'}`
                : 'Date range'}
              {dateFilterOpen && <span className="text-slate-500 ml-0.5">×</span>}
            </button>
            {dateFilterOpen && (
              <div className="flex flex-col sm:flex-row gap-3 items-center mt-2">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {watches.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
          </div>
          <h3
            className="text-lg font-bold text-slate-800 mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            No completed watches yet
          </h3>
          <p className="text-slate-500 text-sm">Completed watches will appear here with full audit trails.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm">No watches match your search.</p>
          <button
            onClick={() => { setSearch(''); setFacilityFilter(''); setDateFrom(''); setDateTo('') }}
            className="mt-3 text-blue-600 hover:text-blue-500 text-sm font-semibold"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {([
                    { key: 'facility', label: 'Job Site' },
                    { key: null, label: 'Fire Watcher', mobileHide: true },
                    { key: 'started', label: 'Started' },
                    { key: 'duration', label: 'Duration', mobileHide: true },
                    { key: 'compliance', label: 'Compliance' },
                    { key: null, label: 'Reason', mobileHide: true },
                  ] as { key: SortKey | null; label: string; mobileHide?: boolean }[]).map(({ key, label, mobileHide }) => (
                    <th
                      key={label}
                      className={`text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest select-none${mobileHide ? ' hidden sm:table-cell' : ''} ${
                        key ? 'cursor-pointer text-slate-500 hover:text-slate-600 transition-colors' : 'text-slate-500'
                      }`}
                      onClick={key ? () => handleSort(key) : undefined}
                      aria-sort={key && sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {key && sortKey === key && (
                          <span className="text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                        {key && sortKey !== key && (
                          <span className="text-slate-200">↕</span>
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="text-right px-5 py-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((w) => {
                  const total = w._completed + w._missed
                  const pct = total > 0 ? Math.round((w._completed / total) * 100) : 100
                  const pctColor = pct === 100 ? 'text-green-600' : pct >= 80 ? 'text-amber-600' : 'text-red-600'
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{w.facilities.name}</div>
                        {w.location && <div className="text-xs text-slate-500 mt-0.5">{w.location}</div>}
                      </td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap hidden sm:table-cell">{w.assigned_name}</td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{format(new Date(w.start_time), 'MMM d, h:mm a')}</td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap hidden sm:table-cell">{formatDuration(w.start_time, w.ended_at)}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {total > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                              <div
                                className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 80 ? 'bg-amber-400' : 'bg-red-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`font-bold text-sm ${pctColor}`}>{pct}%</span>
                            <span className="text-slate-500 text-xs">({w._completed}/{total})</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 max-w-[180px] truncate hidden sm:table-cell">{w.reason || '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/watches/${w.id}`}
                          className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors whitespace-nowrap"
                        >
                          View / Report
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <nav className="flex items-center justify-between px-5 py-3 border-t border-slate-100" aria-label="Pagination">
              <span className="text-xs text-slate-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-xs text-slate-300">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          page === p ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Next →
                </button>
              </div>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
