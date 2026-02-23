'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Facility } from '@/types/database'

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

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Facility name is required'); return }
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
      toast.success('Facility added')
      setForm({ name: '', address: '', timezone: 'America/New_York' })
      setShowForm(false)
      loadFacilities()
    }
  }

  function startEdit(f: Facility) {
    setEditingId(f.id)
    setEditForm({ name: f.name, address: f.address ?? '', timezone: f.timezone })
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
    toast.success('Facility updated')
    setEditingId(null)
    loadFacilities()
  }

  async function handleDeleteRequest(id: string, name: string) {
    setDeletingId(id)
    const supabase = createClient()
    const { count } = await supabase
      .from('watches')
      .select('id', { count: 'exact', head: true })
      .eq('facility_id', id)
      .eq('status', 'active')
    setDeletingId(null)
    if (count && count > 0) {
      toast.error(`"${name}" has ${count} active watch${count !== 1 ? 'es' : ''}. End the watch${count !== 1 ? 'es' : ''} before deleting this facility.`)
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
    toast.success('Facility deleted')
    loadFacilities()
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2
            className="text-3xl text-slate-900"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Facilities
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage the buildings and locations you oversee.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2.5 font-bold rounded-xl text-sm transition-all shadow-sm ${
            showForm
              ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-200 hover:-translate-y-px'
          }`}
        >
          {showForm ? 'Cancel' : '+ Add Facility'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-7 mb-6 shadow-sm">
          <h3
            className="text-base font-bold text-slate-800 mb-5"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Add New Facility
          </h3>
          <form onSubmit={handleAdd} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Facility Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Babson Hall"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Address <span className="text-slate-300 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="123 Main St, Wellesley, MA 02481"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              >
                {TZ_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.zones.map((z) => (
                      <option key={z.value} value={z.value}>{z.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-200"
            >
              {saving ? 'Saving…' : 'Add Facility'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-white border border-slate-200 animate-pulse rounded-xl shadow-sm" />)}
        </div>
      ) : facilities.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span className="text-3xl">🏢</span>
          </div>
          <h3
            className="text-lg font-bold text-slate-800 mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            No facilities yet
          </h3>
          <p className="text-slate-400 text-sm mb-2">Add a facility to get started with fire watch tracking.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Name</th>
                  <th className="text-left px-5 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Address</th>
                  <th className="text-left px-5 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Timezone</th>
                  <th className="text-right px-5 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {facilities.map((f) =>
                  editingId === f.id ? (
                    <tr key={f.id} className="bg-blue-50/40">
                      <td colSpan={4} className="px-5 py-4">
                        <form onSubmit={handleSaveEdit} className="flex flex-wrap gap-3 items-end">
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Name</label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                              required
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div className="flex-1 min-w-[180px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address</label>
                            <input
                              type="text"
                              value={editForm.address}
                              onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div className="min-w-[160px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Timezone</label>
                            <select
                              value={editForm.timezone}
                              onChange={(e) => setEditForm((p) => ({ ...p, timezone: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              {TZ_GROUPS.map((g) => (
                                <optgroup key={g.label} label={g.label}>
                                  {g.zones.map((z) => (
                                    <option key={z.value} value={z.value}>{z.label}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 pb-0.5">
                            <button
                              type="submit"
                              disabled={saving}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold rounded-lg text-sm transition-all"
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg text-sm transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-slate-800">{f.name}</span>
                          {(activeWatchCounts[f.id] ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              {activeWatchCounts[f.id]} active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{f.address || '—'}</td>
                      <td className="px-5 py-4 text-slate-500">{TZ_LABELS[f.timezone] ?? f.timezone}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {confirmDeleteId === f.id ? (
                            <>
                              <button
                                onClick={() => handleDeleteConfirm(f.id)}
                                disabled={deletingId === f.id}
                                className="px-3 py-1.5 text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 font-bold text-sm transition-colors rounded-lg"
                              >
                                {deletingId === f.id ? 'Deleting…' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors rounded-lg hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(f)}
                                className="px-3 py-1.5 text-slate-400 hover:text-blue-600 font-semibold text-sm transition-colors rounded-lg hover:bg-blue-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(f.id, f.name)}
                                disabled={deletingId === f.id}
                                className="px-3 py-1.5 text-slate-400 hover:text-red-600 font-semibold text-sm transition-colors rounded-lg hover:bg-red-50 disabled:text-slate-300"
                              >
                                {deletingId === f.id ? 'Checking…' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
