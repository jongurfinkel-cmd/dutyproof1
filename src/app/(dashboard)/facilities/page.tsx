'use client'

import { useEffect, useState, useRef, forwardRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Facility } from '@/types/database'
import AddressSearch from '@/components/AddressSearch'

const TZ_GROUPS: { label: string; zones: { value: string; label: string }[] }[] = [
  {
    label: 'United States',
    zones: [
      { value: 'America/New_York', label: 'Eastern (ET)' },
      { value: 'America/Chicago', label: 'Central (CT)' },
      { value: 'America/Denver', label: 'Mountain (MT)' },
      { value: 'America/Phoenix', label: 'Arizona (no DST)' },
      { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
      { value: 'America/Anchorage', label: 'Alaska (AKT)' },
      { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
    ],
  },
  {
    label: 'Canada',
    zones: [
      { value: 'America/Halifax', label: 'Atlantic (AT)' },
      { value: 'America/St_Johns', label: 'Newfoundland (NT)' },
      { value: 'America/Toronto', label: 'Eastern — Toronto' },
      { value: 'America/Winnipeg', label: 'Central — Winnipeg' },
      { value: 'America/Edmonton', label: 'Mountain — Edmonton' },
      { value: 'America/Vancouver', label: 'Pacific — Vancouver' },
    ],
  },
  {
    label: 'Europe',
    zones: [
      { value: 'Europe/London', label: 'London (GMT/BST)' },
      { value: 'Europe/Dublin', label: 'Dublin (IST)' },
      { value: 'Europe/Paris', label: 'Central Europe (CET)' },
      { value: 'Europe/Helsinki', label: 'Eastern Europe (EET)' },
    ],
  },
  {
    label: 'Middle East & Africa',
    zones: [
      { value: 'Asia/Dubai', label: 'Gulf (GST)' },
      { value: 'Asia/Riyadh', label: 'Arabia (AST)' },
      { value: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
      { value: 'Africa/Nairobi', label: 'East Africa (EAT)' },
    ],
  },
  {
    label: 'Asia & Pacific',
    zones: [
      { value: 'Asia/Kolkata', label: 'India (IST)' },
      { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
      { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
      { value: 'Asia/Tokyo', label: 'Japan (JST)' },
      { value: 'Asia/Seoul', label: 'Korea (KST)' },
      { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
      { value: 'Australia/Perth', label: 'Perth (AWST)' },
      { value: 'Pacific/Auckland', label: 'New Zealand (NZST)' },
    ],
  },
]

const TZ_LABELS: Record<string, string> = Object.fromEntries(
  TZ_GROUPS.flatMap((g) => g.zones.map((z) => [z.value, z.label]))
)

/* ── tiny reusable bits ─────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5">
      {children}
    </label>
  )
}

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 text-sm
          placeholder:text-slate-300 bg-white
          focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50
          transition-all duration-200 ${props.className ?? ''}`}
      />
    )
  }
)

function Select({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 text-sm bg-white
        focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50
        transition-all duration-200 ${className ?? ''}`}
    >
      {TZ_GROUPS.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.zones.map((z) => (
            <option key={z.value} value={z.value}>{z.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

/* ── icons ──────────────────────────────────────────────────── */

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" strokeWidth={2} />
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

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconFire({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

/* ── main page ──────────────────────────────────────────────── */

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [activeWatchCounts, setActiveWatchCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', timezone: 'America/New_York' })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', address: '', timezone: 'America/New_York' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  async function loadFacilities() {
    const supabase = createClient()
    const [{ data, error }, { data: watchData }] = await Promise.all([
      supabase.from('facilities').select('*').order('name'),
      supabase.from('watches').select('facility_id').eq('status', 'active'),
    ])
    if (error) toast.error('Failed to load facilities')
    else {
      setFacilities((data ?? []) as Facility[])
      const counts: Record<string, number> = {}
      for (const w of watchData ?? []) {
        counts[w.facility_id] = (counts[w.facility_id] ?? 0) + 1
      }
      setActiveWatchCounts(counts)
    }
    setLoading(false)
  }

  useEffect(() => { loadFacilities() }, [])

  useEffect(() => {
    if (showForm) setTimeout(() => nameRef.current?.focus(), 100)
  }, [showForm])

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Job site name is required'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setSaving(false); return }
    const { error } = await supabase.from('facilities').insert({
      name: form.name.trim(),
      address: form.address.trim() || null,
      timezone: form.timezone,
      owner_id: user.id,
    })
    setSaving(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Job site added')
      setForm({ name: '', address: '', timezone: 'America/New_York' })
      setShowForm(false)
      loadFacilities()
    }
  }

  function startEdit(f: Facility) {
    setEditingId(f.id)
    setEditForm({ name: f.name, address: f.address ?? '', timezone: f.timezone })
    setConfirmDeleteId(null)
  }

  async function handleSaveEdit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingId || !editForm.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('facilities')
      .update({ name: editForm.name.trim(), address: editForm.address.trim() || null, timezone: editForm.timezone })
      .eq('id', editingId)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Job site updated')
    setEditingId(null)
    loadFacilities()
  }

  async function handleDeleteRequest(id: string, name: string) {
    setConfirmDeleteId(null)
    setDeletingId(id)
    const supabase = createClient()
    const [{ count: activeCount }, { count: historyCount }] = await Promise.all([
      supabase.from('watches').select('id', { count: 'exact', head: true }).eq('facility_id', id).eq('status', 'active'),
      supabase.from('watches').select('id', { count: 'exact', head: true }).eq('facility_id', id).eq('status', 'completed'),
    ])
    setDeletingId(null)
    if (activeCount && activeCount > 0) {
      toast.error(`"${name}" has ${activeCount} active watch${activeCount !== 1 ? 'es' : ''}. End ${activeCount !== 1 ? 'them' : 'it'} before deleting.`)
      return
    }
    if (historyCount && historyCount > 0) {
      toast.error(`"${name}" has ${historyCount} completed watch${historyCount !== 1 ? 'es' : ''} with compliance records. Download any reports before deleting, then contact support to remove historical data.`)
      return
    }
    setConfirmDeleteId(id)
  }

  async function handleDeleteConfirm(id: string) {
    setDeletingId(id)
    setConfirmDeleteId(null)
    const supabase = createClient()
    const { error } = await supabase.from('facilities').delete().eq('id', id)
    setDeletingId(null)
    if (error) { toast.error(error.message); return }
    toast.success('Job site deleted')
    loadFacilities()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <IconBuilding className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  className="text-xl sm:text-2xl text-slate-900 leading-tight"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                >
                  Job Sites
                </h2>
                {!loading && facilities.length > 0 && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    {facilities.length} site{facilities.length !== 1 ? 's' : ''}
                    {Object.values(activeWatchCounts).reduce((a, b) => a + b, 0) > 0 && (
                      <span className="text-green-500 ml-1.5">
                        &bull; {Object.values(activeWatchCounts).reduce((a, b) => a + b, 0)} active watch{Object.values(activeWatchCounts).reduce((a, b) => a + b, 0) !== 1 ? 'es' : ''}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setConfirmDeleteId(null) }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 ${
              showForm
                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-200/60 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200/80'
            }`}
          >
            {showForm ? (
              <>
                <IconX className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <IconPlus className="w-4 h-4" />
                Add Site
              </>
            )}
          </button>
        </div>

        {/* ── Add Form ──────────────────────────────────── */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showForm ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'
          }`}
        >
          <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <IconPlus className="w-4 h-4 text-blue-500" />
              </div>
              <h3
                className="text-base text-slate-800"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
              >
                New Job Site
              </h3>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label>
                  Job Site Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  ref={nameRef}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="e.g. Ace Mechanical — Building D"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Address <span className="text-slate-300 normal-case font-normal">(optional)</span>
                  </Label>
                  <AddressSearch
                    placeholder="Search address..."
                    onSelect={(result) => setForm((p) => ({ ...p, address: result.address }))}
                  />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Select
                    value={form.timezone}
                    onChange={(v) => setForm((p) => ({ ...p, timezone: v }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400
                    text-white font-bold rounded-xl text-sm transition-all duration-200
                    shadow-lg shadow-blue-200/60 disabled:shadow-none
                    hover:-translate-y-0.5 disabled:hover:translate-y-0"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <IconCheck className="w-4 h-4" />
                      Add Job Site
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-3 text-slate-400 hover:text-slate-600 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border-2 border-slate-100 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-slate-100 rounded-lg mb-2" />
                    <div className="h-3 w-48 bg-slate-50 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : facilities.length === 0 && !showForm ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
              <IconBuilding className="w-8 h-8 text-slate-300" />
            </div>
            <h3
              className="text-lg text-slate-700 mb-2"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              No job sites yet
            </h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
              Add your first job site to start creating fire watches and tracking compliance.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm
                transition-all shadow-lg shadow-blue-200/60 hover:-translate-y-0.5"
            >
              <IconPlus className="w-4 h-4" />
              Add Your First Site
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {facilities.map((f) => {
              const activeCount = activeWatchCounts[f.id] ?? 0
              const isEditing = editingId === f.id
              const isConfirmingDelete = confirmDeleteId === f.id

              return (
                <div
                  key={f.id}
                  className={`bg-white rounded-2xl border-2 transition-all duration-200 ${
                    isEditing
                      ? 'border-blue-200 shadow-lg shadow-blue-50 ring-4 ring-blue-50'
                      : isConfirmingDelete
                        ? 'border-red-200 shadow-lg shadow-red-50 ring-4 ring-red-50'
                        : 'border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* ── Edit Mode ── */}
                  {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="p-5 sm:p-6">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <IconPencil className="w-4 h-4 text-blue-500" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-600">Editing Job Site</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label>Job Site Name <span className="text-red-400">*</span></Label>
                          <Input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Address</Label>
                            <AddressSearch
                              placeholder="Search address..."
                              onSelect={(result) => setEditForm((p) => ({ ...p, address: result.address }))}
                            />
                          </div>
                          <div>
                            <Label>Timezone</Label>
                            <Select
                              value={editForm.timezone}
                              onChange={(v) => setEditForm((p) => ({ ...p, timezone: v }))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                        <button
                          type="submit"
                          disabled={saving || !editForm.name.trim()}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400
                            text-white font-bold rounded-xl text-sm transition-all duration-200
                            shadow-md shadow-blue-200/60 disabled:shadow-none"
                        >
                          {saving ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <IconCheck className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2.5 text-slate-400 hover:text-slate-600 font-semibold text-sm transition-colors rounded-xl hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-5 sm:p-6">
                      {/* ── Delete Confirmation Banner ── */}
                      {isConfirmingDelete && (
                        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between gap-3">
                          <p className="text-sm text-red-700 font-medium">
                            Delete <span className="font-bold">{f.name}</span>? This cannot be undone.
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleDeleteConfirm(f.id)}
                              disabled={deletingId === f.id}
                              className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold text-sm rounded-lg transition-colors"
                            >
                              {deletingId === f.id ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3.5 py-1.5 text-red-400 hover:text-red-600 font-semibold text-sm rounded-lg hover:bg-red-100/50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          activeCount > 0
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100'
                            : 'bg-slate-50 border border-slate-100'
                        }`}>
                          {activeCount > 0 ? (
                            <IconFire className="w-5 h-5 text-green-500" />
                          ) : (
                            <IconBuilding className="w-5 h-5 text-slate-300" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-bold text-slate-800 text-[15px] leading-snug">{f.name}</h3>
                            {activeCount > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-100 text-green-600 text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                {activeCount} active
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1.5">
                            {f.address && (
                              <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                                <IconMapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{f.address}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                              <IconClock className="w-3.5 h-3.5 shrink-0" />
                              {TZ_LABELS[f.timezone] ?? f.timezone}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(f)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
                            title="Edit"
                          >
                            <IconPencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirmDeleteId === f.id) { setConfirmDeleteId(null); return }
                              handleDeleteRequest(f.id, f.name)
                            }}
                            disabled={deletingId === f.id}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:text-slate-200 transition-all duration-200"
                            title="Delete"
                          >
                            {deletingId === f.id ? (
                              <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                            ) : (
                              <IconTrash className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
