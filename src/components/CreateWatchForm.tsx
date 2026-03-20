'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Facility } from '@/types/database'
import LocationPickerDynamic from '@/components/LocationPickerDynamic'

interface ChecklistItem {
  label: string
  shortLabel: string
  requires_photo: boolean
}

// Derived from NFPA 51B (2021) §4.4, §6.2–6.5 · OSHA 29 CFR §1910.252(a)(2) · NFPA 1 Ch. 40
const HOT_WORK_PRESET_ITEMS: ChecklistItem[] = [
  // Hot work permit — NFPA 51B §4.4.1–4.4.4
  { label: 'Hot work permit issued, signed by permit issuer, and posted at work site', shortLabel: 'Hot work permit posted', requires_photo: true },
  // Area clearance — NFPA 51B §6.2.1 · OSHA §1910.252(a)(2)(i)(a)
  { label: 'Combustible and flammable materials within 35 ft removed or shielded with fire-resistant guards', shortLabel: 'Combustibles cleared (35 ft)', requires_photo: false },
  // Floor protection — NFPA 51B §6.2.3 · OSHA §1910.252(a)(2)(i)(b)
  { label: 'Floor swept clean within 35 ft; combustible floors wet down or covered with fire-resistant material', shortLabel: 'Floor protected (35 ft)', requires_photo: false },
  // Openings sealed — NFPA 51B §6.2.2 · OSHA §1910.252(a)(2)(i)(c)
  { label: 'Floor openings, wall penetrations, and gaps within 35 ft covered to prevent spark passage', shortLabel: 'Openings & gaps sealed', requires_photo: false },
  // Adjacent areas — NFPA 51B §6.2.4
  { label: 'Areas above, below, and adjacent to hot work zone inspected and protected', shortLabel: 'Adjacent areas inspected', requires_photo: false },
  // Extinguisher — NFPA 51B §6.3.1 · OSHA §1910.252(a)(2)(iii)(b)
  { label: 'Fire extinguisher at work site — correct class (ABC), fully charged, pressure in green zone', shortLabel: 'Fire extinguisher ready', requires_photo: true },
  // Sprinklers — NFPA 51B §6.2.6–6.2.7 · NFPA 1 §40.3.1
  { label: 'Sprinkler system operational and heads unobstructed; system NOT impaired without AHJ authorization', shortLabel: 'Sprinklers operational', requires_photo: false },
  // Alarm notification — NFPA 51B §4.4.5
  { label: 'Fire alarm monitoring station notified of hot work location and time window', shortLabel: 'Monitoring station notified', requires_photo: false },
  // Sole duty — NFPA 51B §6.4.3
  { label: 'Fire watcher confirmed: no other duties during this watch', shortLabel: 'Sole duty confirmed', requires_photo: false },
  // Post-work watch — NFPA 51B §6.5.1 · OSHA §1910.252(a)(2)(iii)(c)
  { label: 'Fire watcher briefed: 30-minute post-hot-work watch required after all work stops', shortLabel: '30-min post-watch briefed', requires_photo: false },
]

// Keep backward-compatible alias
const PRESET_ITEMS = HOT_WORK_PRESET_ITEMS

const IMPAIRMENT_PRESET_ITEMS: ChecklistItem[] = [
  { label: 'Impaired fire protection system/device identified and documented', shortLabel: 'Impaired system identified', requires_photo: true },
  { label: 'Impairment tag attached to system control valve or panel', shortLabel: 'Impairment tag confirmed', requires_photo: true },
  { label: 'Zone/area of coverage for impaired system understood and documented', shortLabel: 'Coverage zone documented', requires_photo: false },
  { label: 'Compensatory measures in place (portable extinguishers, additional personnel)', shortLabel: 'Compensatory measures in place', requires_photo: false },
  { label: 'AHJ and/or internal fire safety office notified of impairment', shortLabel: 'AHJ/internal notification confirmed', requires_photo: false },
  { label: 'Building occupants in affected area notified of impaired protection', shortLabel: 'Occupants notified', requires_photo: false },
  { label: 'Fire watch patrol route established covering all affected areas', shortLabel: 'Patrol route established', requires_photo: false },
  { label: 'Emergency contact numbers posted and accessible', shortLabel: 'Emergency contacts posted', requires_photo: false },
]

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.12em]">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

export default function CreateWatchForm() {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    facility_id: '',
    location: '',
    reason: '',
    check_interval_min: '15',
    assigned_name: '',
    assigned_phone: '',
    escalation_phone: '',
    escalation_delay_min: '0',
    start_time: toLocalDatetimeValue(new Date()),
    planned_end_time: '',
    watch_type: 'hot_work' as 'hot_work' | 'impairment',
    permit_number: '',
    post_work_duration_min: '30',
    secondary_escalation_phone: '',
  })
  const [customInterval, setCustomInterval] = useState('20')
  const [customPostWork, setCustomPostWork] = useState('45')
  const [escalationEnabled, setEscalationEnabled] = useState(false)
  const [checklistEnabled, setChecklistEnabled] = useState(false)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemPhoto, setNewItemPhoto] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [smsConsent, setSmsConsent] = useState(false)
  const [permitPhotoFile, setPermitPhotoFile] = useState<File | null>(null)
  const [permitPhotoPreview, setPermitPhotoPreview] = useState<string | null>(null)
  const permitFileRef = useRef<HTMLInputElement>(null)
  const [geofenceEnabled, setGeofenceEnabled] = useState(false)
  const [watchLatitude, setWatchLatitude] = useState<number | null>(null)
  const [watchLongitude, setWatchLongitude] = useState<number | null>(null)
  const [watchRadiusM, setWatchRadiusM] = useState(100)
  const [customRadius, setCustomRadius] = useState('300')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('facilities').select('*').order('name').then(({ data, error }) => {
      if (error) {
        toast.error('Failed to load job sites. Please refresh.')
      } else if (data) {
        setFacilities(data)
      }
    })
  }, [])

  // Clean up object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (permitPhotoPreview) URL.revokeObjectURL(permitPhotoPreview)
    }
  }, [permitPhotoPreview])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Normalize to E.164: strips formatting, prepends +1 for 10-digit US numbers
  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10) return `+1${digits}`
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
    if (raw.trim().startsWith('+')) return `+${digits}`
    return raw.trim()
  }

  function handlePhoneBlur(field: 'assigned_phone' | 'escalation_phone' | 'secondary_escalation_phone') {
    const value = form[field]
    if (value.trim()) {
      const normalized = normalizePhone(value)
      setForm((prev) => ({ ...prev, [field]: normalized }))
    }
  }

  function setNow() {
    setForm((prev) => ({ ...prev, start_time: toLocalDatetimeValue(new Date()) }))
  }

  function toggleEscalation() {
    setEscalationEnabled((prev) => {
      if (prev) setForm((f) => ({ ...f, escalation_phone: '', escalation_delay_min: '0', secondary_escalation_phone: '' }))
      return !prev
    })
  }

  function getActivePresets(): ChecklistItem[] {
    return form.watch_type === 'impairment' ? IMPAIRMENT_PRESET_ITEMS : PRESET_ITEMS
  }

  function handleWatchTypeChange(newType: 'hot_work' | 'impairment') {
    if (newType === form.watch_type) return
    setForm((prev) => ({ ...prev, watch_type: newType }))
    setChecklistItems([])
  }

  function addPreset(preset: ChecklistItem) {
    if (checklistItems.some((i) => i.label === preset.label)) return
    setChecklistItems((prev) => [...prev, preset])
  }

  function addCustomItem() {
    const label = newItemLabel.trim()
    if (!label) return
    setChecklistItems((prev) => [...prev, { label, shortLabel: label, requires_photo: newItemPhoto }])
    setNewItemLabel('')
    setNewItemPhoto(false)
  }

  function removeItem(index: number) {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handlePermitPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPermitPhotoFile(file)
    if (permitPhotoPreview) URL.revokeObjectURL(permitPhotoPreview)
    setPermitPhotoPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.facility_id) {
      toast.error('Please select a job site')
      return
    }
    if (smsEnabled) {
      if (!form.assigned_phone.match(/^\+?[\d\s\-().]{10,}$/)) {
        toast.error('Please enter a valid worker phone number')
        return
      }
      if (!smsConsent) {
        toast.error('Please confirm SMS consent before starting the watch')
        return
      }
    }
    if (escalationEnabled) {
      if (!form.escalation_phone) {
        toast.error('Please enter a supervisor phone number for escalation alerts')
        return
      }
      if (!form.escalation_phone.match(/^\+?[\d\s\-().]{10,}$/)) {
        toast.error('Please enter a valid supervisor phone number')
        return
      }
      if (form.secondary_escalation_phone.trim() && !form.secondary_escalation_phone.match(/^\+?[\d\s\-().]{10,}$/)) {
        toast.error('Please enter a valid backup supervisor phone number')
        return
      }
    }
    const isCustom = form.check_interval_min === 'custom'
    if (isCustom) {
      const val = parseInt(customInterval)
      if (!customInterval || isNaN(val) || val < 5 || val > 120) {
        toast.error('Custom interval must be between 5 and 120 minutes')
        return
      }
    }
    const isCustomPostWork = form.post_work_duration_min === 'custom'
    if (isCustomPostWork) {
      const val = parseInt(customPostWork)
      if (!customPostWork || isNaN(val) || val < 5 || val > 480) {
        toast.error('Custom post-work duration must be between 5 and 480 minutes')
        return
      }
    }
    if (form.planned_end_time && form.planned_end_time <= form.start_time) {
      toast.error('Expected end time must be after start time')
      return
    }

    const resolvedInterval = isCustom ? parseInt(customInterval) : parseInt(form.check_interval_min)
    const resolvedPostWork = isCustomPostWork ? parseInt(customPostWork) : parseInt(form.post_work_duration_min)

    setLoading(true)
    try {
      // Upload permit photo if selected
      let permit_photo_url: string | null = null
      if (permitPhotoFile) {
        const photoFormData = new FormData()
        photoFormData.append('file', permitPhotoFile)
        const uploadRes = await fetch('/api/watches/upload-permit', {
          method: 'POST',
          body: photoFormData,
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload permit photo')
        permit_photo_url = uploadData.photo_url
      }

      const res = await fetch('/api/watches/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          watch_type: form.watch_type,
          permit_number: form.permit_number || null,
          permit_photo_url,
          post_work_duration_min: resolvedPostWork,
          assigned_phone: smsEnabled ? form.assigned_phone : null,
          sms_enabled: smsEnabled,
          check_interval_min: resolvedInterval,
          escalation_phone: escalationEnabled ? form.escalation_phone : null,
          secondary_escalation_phone: escalationEnabled && form.secondary_escalation_phone.trim() ? form.secondary_escalation_phone : null,
          escalation_delay_min: escalationEnabled ? parseInt(form.escalation_delay_min) : 0,
          start_time: new Date(form.start_time).toISOString(),
          planned_end_time: form.planned_end_time ? new Date(form.planned_end_time).toISOString() : null,
          checklist_items: checklistEnabled ? checklistItems : [],
          watch_latitude: geofenceEnabled ? watchLatitude : null,
          watch_longitude: geofenceEnabled ? watchLongitude : null,
          watch_radius_m: geofenceEnabled ? watchRadiusM : 100,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start watch')
      toast.success(
        !smsEnabled
          ? 'Watch started! (No SMS — manual monitoring mode)'
          : checklistEnabled && checklistItems.length > 0
            ? 'Watch started! Safety checklist & check-in SMS sent.'
            : 'Watch started! First check-in SMS sent.'
      )
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start watch')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm'
  const checklistBlocking = checklistEnabled && checklistItems.length === 0
  const activePresets = getActivePresets()

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Watch Type ── */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Watch Type <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          {[
            { value: 'hot_work' as const, label: 'Hot Work', hint: 'NFPA 51B' },
            { value: 'impairment' as const, label: 'Impairment', hint: 'NFPA 25' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 border-2 rounded-xl cursor-pointer transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
                form.watch_type === opt.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name="watch_type"
                value={opt.value}
                checked={form.watch_type === opt.value}
                onChange={() => handleWatchTypeChange(opt.value)}
              />
              <span className="font-bold text-sm">{opt.label}</span>
              {opt.hint && <span className="text-[10px] text-slate-500">{opt.hint}</span>}
            </label>
          ))}
        </div>
      </div>

      {/* ── Where / What ── */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Job Site <span className="text-red-400">*</span>
        </label>
        {facilities.length === 0 ? (
          <div className="text-sm text-amber-700 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            No job sites yet.{' '}
            <a href="/facilities" className="text-blue-600 hover:underline font-semibold">
              Add a job site first.
            </a>
          </div>
        ) : (
          <select
            value={form.facility_id}
            onChange={(e) => set('facility_id', e.target.value)}
            required
            className={`${inputClass} bg-white`}
          >
            <option value="">Select job site…</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Location / Area <span className="text-slate-300 normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => set('location', e.target.value)}
          placeholder="e.g. Building D, Bay 2, Roof Level, West Dock"
          className={inputClass}
        />
      </div>

      {/* ── Watch Location Geofence ── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setGeofenceEnabled((prev) => {
            if (prev) {
              setWatchLatitude(null)
              setWatchLongitude(null)
              setWatchRadiusM(100)
            }
            return !prev
          })}
          role="switch"
          aria-checked={geofenceEnabled}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        >
          <div>
            <p className="text-sm font-bold text-slate-800">Set Watch Location</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Drop a pin on the map to define a geofence for check-in location tracking
            </p>
          </div>
          <div aria-hidden="true" className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${geofenceEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${geofenceEnabled ? 'left-5' : 'left-0.5'}`} />
          </div>
        </button>

        {geofenceEnabled && (
          <div className="border-t border-slate-200 px-5 py-4 bg-slate-50 space-y-4">
            <LocationPickerDynamic
              latitude={watchLatitude}
              longitude={watchLongitude}
              radius={watchRadiusM}
              onChange={({ latitude, longitude }) => {
                setWatchLatitude(latitude)
                setWatchLongitude(longitude)
              }}
            />

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Geofence Radius
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 50, label: '50m' },
                  { value: 100, label: '100m' },
                  { value: 200, label: '200m' },
                  { value: 500, label: '500m' },
                  { value: -1, label: 'Custom' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-center py-2 px-4 border-2 rounded-xl cursor-pointer transition-all text-sm font-bold ${
                      (opt.value === -1 ? ![50, 100, 200, 500].includes(watchRadiusM) : watchRadiusM === opt.value)
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="watch_radius"
                      checked={opt.value === -1 ? ![50, 100, 200, 500].includes(watchRadiusM) : watchRadiusM === opt.value}
                      onChange={() => {
                        if (opt.value === -1) {
                          setWatchRadiusM(parseInt(customRadius) || 300)
                        } else {
                          setWatchRadiusM(opt.value)
                        }
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {![50, 100, 200, 500].includes(watchRadiusM) && (
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number"
                    value={customRadius}
                    onChange={(e) => {
                      setCustomRadius(e.target.value)
                      const val = parseInt(e.target.value)
                      if (val >= 10 && val <= 5000) setWatchRadiusM(val)
                    }}
                    min="10"
                    max="5000"
                    placeholder="300"
                    className={`${inputClass} w-28`}
                  />
                  <span className="text-sm text-slate-500">meters</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Reason for Watch <span className="text-slate-300 normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={form.reason}
          onChange={(e) => set('reason', e.target.value)}
          placeholder="e.g. Post-weld watch — pipe cutting Bay 3"
          className={inputClass}
        />
      </div>

      {/* ── Permit Fields ── */}
      <Divider label="Permit" />

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Permit Number <span className="text-slate-300 normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={form.permit_number}
          onChange={(e) => set('permit_number', e.target.value)}
          maxLength={100}
          placeholder="e.g. HWP-2026-0042"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Permit Photo <span className="text-slate-300 normal-case">(optional)</span>
        </label>
        <input
          ref={permitFileRef}
          type="file"
          accept="image/*"
          onChange={handlePermitPhotoSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => permitFileRef.current?.click()}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
        >
          {permitPhotoFile ? 'Change Photo' : 'Upload Photo'}
        </button>
        {permitPhotoPreview && (
          <div className="mt-3 relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={permitPhotoPreview}
              alt="Permit photo preview"
              className="w-32 h-32 object-cover rounded-xl border border-slate-200"
            />
            <button
              type="button"
              onClick={() => {
                setPermitPhotoFile(null)
                if (permitPhotoPreview) URL.revokeObjectURL(permitPhotoPreview)
                setPermitPhotoPreview(null)
                if (permitFileRef.current) permitFileRef.current.value = ''
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-400 transition-colors"
            >
              x
            </button>
          </div>
        )}
      </div>

      <Divider label="Worker" />

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Fire Watcher Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.assigned_name}
          onChange={(e) => set('assigned_name', e.target.value)}
          required
          placeholder="Full name of the fire watcher"
          className={inputClass}
        />
      </div>

      {/* ── SMS Notifications Toggle ── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setSmsEnabled((prev) => {
              if (prev) {
                // Turning off SMS — clear phone and consent
                setForm((f) => ({ ...f, assigned_phone: '' }))
                setSmsConsent(false)
              }
              return !prev
            })
          }}
          role="switch"
          aria-checked={smsEnabled}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        >
          <div>
            <p className="text-sm font-bold text-slate-800">SMS Check-in Reminders</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Send check-in links and alerts to the worker via text message (optional)
            </p>
          </div>
          <div aria-hidden="true" className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${smsEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${smsEnabled ? 'left-5' : 'left-0.5'}`} />
          </div>
        </button>

        {smsEnabled && (
          <div className="border-t border-slate-200 px-5 py-4 bg-slate-50 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Worker&apos;s Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={form.assigned_phone}
                onChange={(e) => set('assigned_phone', e.target.value)}
                onBlur={() => handlePhoneBlur('assigned_phone')}
                required
                autoComplete="tel"
                placeholder="+1 (212) 000-0000"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Include country code, e.g. <span className="font-mono">+1 212 000 0000</span>. SMS check-in links go here.
              </p>
            </div>
          </div>
        )}
      </div>

      <Divider label="Timing" />

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Check-in Interval <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          {[
            { value: '15', label: '15 min', hint: 'most AHJs' },
            { value: '30', label: '30 min', hint: '' },
            { value: 'custom', label: 'Custom', hint: '' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 border-2 rounded-xl cursor-pointer transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
                form.check_interval_min === opt.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name="check_interval_min"
                value={opt.value}
                checked={form.check_interval_min === opt.value}
                onChange={() => set('check_interval_min', opt.value)}
              />
              <span className="font-bold text-sm">{opt.label}</span>
              {opt.hint && <span className="text-[10px] text-slate-500">{opt.hint}</span>}
            </label>
          ))}
        </div>
        {form.check_interval_min === 'custom' && (
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              value={customInterval}
              onChange={(e) => setCustomInterval(e.target.value)}
              min="5"
              max="120"
              placeholder="20"
              className={`${inputClass} w-28`}
            />
            <span className="text-sm text-slate-500">minutes per round</span>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Start Time <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={setNow}
            className="text-xs text-blue-600 hover:text-blue-500 font-bold transition-colors"
          >
            Set to Now
          </button>
        </div>
        <input
          type="datetime-local"
          value={form.start_time}
          onChange={(e) => set('start_time', e.target.value)}
          required
          className={inputClass}
        />
        <p className="text-xs text-slate-500 mt-1.5">{smsEnabled ? 'First SMS will be sent at this time.' : 'Watch begins recording at this time.'}</p>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Expected End Time <span className="text-slate-300 normal-case">(optional)</span>
        </label>
        <input
          type="datetime-local"
          value={form.planned_end_time}
          onChange={(e) => set('planned_end_time', e.target.value)}
          min={form.start_time}
          className={inputClass}
        />
        <p className="text-xs text-slate-500 mt-1.5">For your audit trail and reports. Watch continues until manually ended.</p>
      </div>

      {/* ── Post-Work Duration ── */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Post-Work Watch Duration
        </label>
        <div className="flex gap-2">
          {[
            { value: '30', label: '30 min', hint: 'NFPA default' },
            { value: '60', label: '60 min', hint: '' },
            { value: 'custom', label: 'Custom', hint: '' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 border-2 rounded-xl cursor-pointer transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
                form.post_work_duration_min === opt.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name="post_work_duration_min"
                value={opt.value}
                checked={form.post_work_duration_min === opt.value}
                onChange={() => set('post_work_duration_min', opt.value)}
              />
              <span className="font-bold text-sm">{opt.label}</span>
              {opt.hint && <span className="text-[10px] text-slate-500">{opt.hint}</span>}
            </label>
          ))}
        </div>
        {form.post_work_duration_min === 'custom' && (
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              value={customPostWork}
              onChange={(e) => setCustomPostWork(e.target.value)}
              min="5"
              max="480"
              placeholder="45"
              className={`${inputClass} w-28`}
            />
            <span className="text-sm text-slate-500">minutes after work stops</span>
          </div>
        )}
      </div>

      {/* ── Supervisor Escalation ── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={toggleEscalation}
          role="switch"
          aria-checked={escalationEnabled}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        >
          <div>
            <p className="text-sm font-bold text-slate-800">Supervisor Escalation</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Alert a supervisor by SMS when a check-in is missed
            </p>
          </div>
          <div aria-hidden="true" className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${escalationEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${escalationEnabled ? 'left-5' : 'left-0.5'}`} />
          </div>
        </button>

        {escalationEnabled && (
          <div className="border-t border-slate-200 px-5 py-4 bg-slate-50 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Supervisor / Admin Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={form.escalation_phone}
                onChange={(e) => set('escalation_phone', e.target.value)}
                onBlur={() => handlePhoneBlur('escalation_phone')}
                autoComplete="tel"
                placeholder="+1 (212) 000-0000"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1.5">Include country code. Alert SMS goes here.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Backup Supervisor Phone <span className="text-slate-300 normal-case">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.secondary_escalation_phone}
                onChange={(e) => set('secondary_escalation_phone', e.target.value)}
                onBlur={() => handlePhoneBlur('secondary_escalation_phone')}
                autoComplete="tel"
                placeholder="+1 (212) 000-0000"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                If the primary supervisor doesn&apos;t acknowledge within 3 minutes, this contact gets notified.
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Alert Delay
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: '0',  label: 'Immediate' },
                  { value: '15', label: '15 min' },
                  { value: '30', label: '30 min' },
                  { value: '60', label: '1 hr' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-center py-2.5 border-2 rounded-xl cursor-pointer text-xs font-bold transition-all ${
                      form.escalation_delay_min === opt.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="escalation_delay_min"
                      value={opt.value}
                      checked={form.escalation_delay_min === opt.value}
                      onChange={() => set('escalation_delay_min', opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                How long after a missed check-in before the supervisor is texted.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Pre-Watch Safety Checklist ── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setChecklistEnabled((v) => !v)}
          role="switch"
          aria-checked={checklistEnabled}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        >
          <div>
            <p className="text-sm font-bold text-slate-800">Pre-Watch Safety Checklist</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Worker completes safety items via SMS link before rounds begin
            </p>
          </div>
          <div aria-hidden="true" className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${checklistEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${checklistEnabled ? 'left-5' : 'left-0.5'}`} />
          </div>
        </button>

        {checklistEnabled && (
          <div className="border-t border-slate-200 px-5 py-4 bg-slate-50 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Add</p>
                {activePresets.some((p) => !checklistItems.some((i) => i.label === p.label)) && (
                  <button
                    type="button"
                    onClick={() => {
                      const toAdd = activePresets.filter((p) => !checklistItems.some((i) => i.label === p.label))
                      setChecklistItems((prev) => [...prev, ...toAdd])
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    + Add all ({activePresets.filter((p) => !checklistItems.some((i) => i.label === p.label)).length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {activePresets.map((preset) => {
                  const added = checklistItems.some((i) => i.label === preset.label)
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => addPreset(preset)}
                      disabled={added}
                      title={preset.label}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        added
                          ? 'border-green-200 bg-green-50 text-green-700 cursor-default'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {added ? '✓ ' : '+ '}
                      {preset.shortLabel}
                      {preset.requires_photo && <span className="ml-1 text-blue-500">📷</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {checklistItems.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Checklist ({checklistItems.length} item{checklistItems.length !== 1 ? 's' : ''})
                </p>
                <div className="space-y-2">
                  {checklistItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">{item.label}</p>
                        {item.requires_photo && (
                          <span className="text-[10px] text-blue-600 font-semibold">📷 Photo required</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-slate-300 hover:text-red-400 text-xl leading-none mt-0.5 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Custom Item</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addCustomItem() }
                  }}
                  placeholder="Describe the safety check…"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addCustomItem}
                  className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItemPhoto}
                  onChange={(e) => setNewItemPhoto(e.target.checked)}
                  className="rounded accent-blue-600"
                />
                <span className="text-xs text-slate-500">Require photo for this item</span>
              </label>
            </div>

            {checklistItems.length === 0 && (
              <p className="text-xs text-amber-600 text-center">
                Add at least one item above, or disable the checklist toggle.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── SMS Consent (only when SMS is enabled) ── */}
      {smsEnabled && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl px-5 py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              className="mt-0.5 rounded accent-blue-600 flex-shrink-0"
            />
            <span className="text-sm text-slate-700 leading-relaxed">
              I agree to receive automated SMS text messages from DutyProof related to fire watch
              patrol reminders, missed check-in alerts, supervisor escalation alerts, and safety
              checklist links. Message frequency varies based on watch activity and check-in schedules.
              Msg &amp; data rates may apply. Reply STOP to opt out. Reply HELP for help.
              SMS consent is not required to use DutyProof.{' '}
              <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">Terms</a>
              {' · '}
              <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">Privacy</a>
              {' · '}
              <a href="/sms-consent" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">SMS Terms</a>
            </span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="pt-3 flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || facilities.length === 0 || checklistBlocking || (smsEnabled && !smsConsent)}
          className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {loading ? 'Starting Watch…' : smsEnabled ? 'Start Watch & Send SMS' : 'Start Watch'}
        </button>
      </div>
    </form>
  )
}
