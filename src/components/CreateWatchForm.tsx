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
  { label: 'Hot work permit issued, signed by permit issuer, and posted at work site', shortLabel: 'Hot work permit posted', requires_photo: true },
  { label: 'Combustible and flammable materials within 35 ft removed or shielded with fire-resistant guards', shortLabel: 'Combustibles cleared (35 ft)', requires_photo: false },
  { label: 'Floor swept clean within 35 ft; combustible floors wet down or covered with fire-resistant material', shortLabel: 'Floor protected (35 ft)', requires_photo: false },
  { label: 'Floor openings, wall penetrations, and gaps within 35 ft covered to prevent spark passage', shortLabel: 'Openings & gaps sealed', requires_photo: false },
  { label: 'Areas above, below, and adjacent to hot work zone inspected and protected', shortLabel: 'Adjacent areas inspected', requires_photo: false },
  { label: 'Fire extinguisher at work site — correct class (ABC), fully charged, pressure in green zone', shortLabel: 'Fire extinguisher ready', requires_photo: true },
  { label: 'Sprinkler system operational and heads unobstructed; system NOT impaired without AHJ authorization', shortLabel: 'Sprinklers operational', requires_photo: false },
  { label: 'Fire alarm monitoring station notified of hot work location and time window', shortLabel: 'Monitoring station notified', requires_photo: false },
  { label: 'Fire watcher confirmed: no other duties during this watch', shortLabel: 'Sole duty confirmed', requires_photo: false },
  { label: 'Fire watcher briefed: 30-minute post-hot-work watch required after all work stops', shortLabel: '30-min post-watch briefed', requires_photo: false },
]

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

// ===== STEP INDICATOR =====
function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const isActive = step === current
        const isDone = step < current
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' :
                isDone ? 'bg-green-500 text-white' :
                'bg-slate-100 text-slate-400'
              }`}>
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                ) : step}
              </div>
              <span className={`text-[10px] font-bold mt-1.5 text-center leading-tight ${
                isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-slate-400'
              }`}>
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full mt-[-14px] ${isDone ? 'bg-green-400' : 'bg-slate-100'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ===== TOGGLE SWITCH =====
function ToggleSwitch({ label, description, enabled, onToggle, children }: {
  label: string; description: string; enabled: boolean; onToggle: () => void; children?: React.ReactNode
}) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${enabled ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}>
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
      >
        <div>
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        <div aria-hidden="true" className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
        </div>
      </button>
      {enabled && children && (
        <div className="border-t border-slate-200 px-5 py-4 bg-slate-50/80 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ===== RADIO PILL GROUP =====
function PillGroup({ options, value, onChange, name }: {
  options: { value: string; label: string; hint?: string }[]
  value: string; onChange: (v: string) => void; name: string
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 border-2 rounded-xl cursor-pointer transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
            value === opt.value
              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <input type="radio" className="sr-only" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} />
          <span className="font-bold text-sm">{opt.label}</span>
          {opt.hint && <span className="text-[10px] text-slate-500">{opt.hint}</span>}
        </label>
      ))}
    </div>
  )
}

// ===== LABEL =====
function Label({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
      {optional && <span className="text-slate-300 normal-case ml-1">(optional)</span>}
    </label>
  )
}

export default function CreateWatchForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
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
      if (error) toast.error('Failed to load job sites. Please refresh.')
      else if (data) setFacilities(data)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (permitPhotoPreview) URL.revokeObjectURL(permitPhotoPreview)
    }
  }, [permitPhotoPreview])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

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

  const inputClass = 'w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm'

  // ===== STEP VALIDATION =====
  function canAdvance(s: number): boolean {
    if (s === 1) {
      if (!form.facility_id) { toast.error('Please select a job site'); return false }
      return true
    }
    if (s === 2) {
      if (!form.assigned_name.trim()) { toast.error('Please enter the fire watcher name'); return false }
      if (smsEnabled) {
        if (!form.assigned_phone.match(/^\+?[\d\s\-().]{10,}$/)) { toast.error('Please enter a valid worker phone number'); return false }
      }
      if (escalationEnabled) {
        if (!form.escalation_phone.match(/^\+?[\d\s\-().]{10,}$/)) { toast.error('Please enter a valid supervisor phone number'); return false }
        if (form.secondary_escalation_phone.trim() && !form.secondary_escalation_phone.match(/^\+?[\d\s\-().]{10,}$/)) { toast.error('Please enter a valid backup phone number'); return false }
      }
      return true
    }
    if (s === 3) {
      const isCustom = form.check_interval_min === 'custom'
      if (isCustom) {
        const val = parseInt(customInterval)
        if (!customInterval || isNaN(val) || val < 5 || val > 120) { toast.error('Custom interval must be 5–120 minutes'); return false }
      }
      const isCustomPW = form.post_work_duration_min === 'custom'
      if (isCustomPW) {
        const val = parseInt(customPostWork)
        if (!customPostWork || isNaN(val) || val < 5 || val > 480) { toast.error('Custom post-work duration must be 5–480 minutes'); return false }
      }
      if (form.planned_end_time && form.planned_end_time <= form.start_time) { toast.error('End time must be after start time'); return false }
      return true
    }
    return true
  }

  function nextStep() {
    if (canAdvance(step)) setStep((s) => Math.min(s + 1, 4))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1))
  }

  // ===== SUBMIT =====
  async function handleSubmit() {
    if (!canAdvance(1) || !canAdvance(2) || !canAdvance(3)) return
    if (checklistEnabled && checklistItems.length === 0) { toast.error('Add at least one checklist item, or disable the checklist'); return }
    if (smsEnabled && !smsConsent) { toast.error('Please confirm SMS consent'); return }

    const resolvedInterval = form.check_interval_min === 'custom' ? parseInt(customInterval) : parseInt(form.check_interval_min)
    const resolvedPostWork = form.post_work_duration_min === 'custom' ? parseInt(customPostWork) : parseInt(form.post_work_duration_min)

    setLoading(true)
    try {
      let permit_photo_url: string | null = null
      if (permitPhotoFile) {
        const photoFormData = new FormData()
        photoFormData.append('file', permitPhotoFile)
        const uploadRes = await fetch('/api/watches/upload-permit', { method: 'POST', body: photoFormData })
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

  const checklistBlocking = checklistEnabled && checklistItems.length === 0
  const activePresets = getActivePresets()
  const TOTAL_STEPS = 4
  const stepLabels = ['Location', 'Worker', 'Schedule', 'Review']

  // ===== REVIEW SUMMARY HELPER =====
  function getIntervalLabel(): string {
    if (form.check_interval_min === 'custom') return `${customInterval} min`
    return `${form.check_interval_min} min`
  }
  function getPostWorkLabel(): string {
    if (form.post_work_duration_min === 'custom') return `${customPostWork} min`
    return `${form.post_work_duration_min} min`
  }
  const selectedFacility = facilities.find((f) => f.id === form.facility_id)

  return (
    <div>
      <StepIndicator current={step} total={TOTAL_STEPS} labels={stepLabels} />

      {/* ============================================================ */}
      {/* STEP 1: LOCATION & TYPE                                      */}
      {/* ============================================================ */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>What are you watching?</h3>
            <p className="text-sm text-slate-500 mt-0.5">Select the type of watch and where it&apos;s happening.</p>
          </div>

          {/* Watch Type */}
          <div>
            <Label>Watch Type<span className="text-red-400 ml-1">*</span></Label>
            <PillGroup
              name="watch_type"
              value={form.watch_type}
              onChange={(v) => handleWatchTypeChange(v as 'hot_work' | 'impairment')}
              options={[
                { value: 'hot_work', label: 'Hot Work', hint: 'NFPA 51B' },
                { value: 'impairment', label: 'Impairment', hint: 'NFPA 25' },
              ]}
            />
          </div>

          {/* Job Site */}
          <div>
            <Label required>Job Site</Label>
            {facilities.length === 0 ? (
              <div className="text-sm text-amber-700 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                No job sites yet.{' '}
                <a href="/facilities" className="text-blue-600 hover:underline font-semibold">Add a job site first.</a>
              </div>
            ) : (
              <select value={form.facility_id} onChange={(e) => set('facility_id', e.target.value)} required className={`${inputClass} bg-white`}>
                <option value="">Select job site...</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
          </div>

          {/* Location */}
          <div>
            <Label optional>Location / Area</Label>
            <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Building D, Bay 2, Roof Level" className={inputClass} />
          </div>

          {/* Geofence */}
          <ToggleSwitch
            label="Set Watch Location"
            description="Drop a pin on the map to define a geofence for check-in tracking"
            enabled={geofenceEnabled}
            onToggle={() => {
              setGeofenceEnabled((prev) => {
                if (prev) { setWatchLatitude(null); setWatchLongitude(null); setWatchRadiusM(100) }
                return !prev
              })
            }}
          >
            <LocationPickerDynamic
              latitude={watchLatitude}
              longitude={watchLongitude}
              radius={watchRadiusM}
              onChange={({ latitude, longitude }) => { setWatchLatitude(latitude); setWatchLongitude(longitude) }}
            />
            <div>
              <Label>Geofence Radius</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 50, label: '50m' },
                  { value: 100, label: '100m' },
                  { value: 200, label: '200m' },
                  { value: 500, label: '500m' },
                  { value: -1, label: 'Custom' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center justify-center py-2 px-4 border-2 rounded-xl cursor-pointer transition-all text-sm font-bold ${
                    (opt.value === -1 ? ![50, 100, 200, 500].includes(watchRadiusM) : watchRadiusM === opt.value)
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    <input type="radio" className="sr-only" name="watch_radius" checked={opt.value === -1 ? ![50, 100, 200, 500].includes(watchRadiusM) : watchRadiusM === opt.value}
                      onChange={() => { if (opt.value === -1) { setWatchRadiusM(parseInt(customRadius) || 300) } else { setWatchRadiusM(opt.value) } }} />
                    {opt.label}
                  </label>
                ))}
              </div>
              {![50, 100, 200, 500].includes(watchRadiusM) && (
                <div className="mt-2 flex items-center gap-3">
                  <input type="number" value={customRadius} onChange={(e) => { setCustomRadius(e.target.value); const val = parseInt(e.target.value); if (val >= 10 && val <= 5000) setWatchRadiusM(val) }}
                    min="10" max="5000" placeholder="300" className={`${inputClass} w-28`} />
                  <span className="text-sm text-slate-500">meters</span>
                </div>
              )}
            </div>
          </ToggleSwitch>

          {/* Reason */}
          <div>
            <Label optional>Reason for Watch</Label>
            <input type="text" value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="e.g. Post-weld watch — pipe cutting Bay 3" className={inputClass} />
          </div>

          {/* Permit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label optional>Permit Number</Label>
              <input type="text" value={form.permit_number} onChange={(e) => set('permit_number', e.target.value)} maxLength={100} placeholder="e.g. HWP-2026-0042" className={inputClass} />
            </div>
            <div>
              <Label optional>Permit Photo</Label>
              <input ref={permitFileRef} type="file" accept="image/*" onChange={handlePermitPhotoSelect} className="hidden" />
              <button type="button" onClick={() => permitFileRef.current?.click()}
                className="w-full px-4 py-3 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                {permitPhotoFile ? 'Change Photo' : 'Upload Photo'}
              </button>
              {permitPhotoPreview && (
                <div className="mt-2 relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={permitPhotoPreview} alt="Permit preview" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                  <button type="button" onClick={() => { setPermitPhotoFile(null); if (permitPhotoPreview) URL.revokeObjectURL(permitPhotoPreview); setPermitPhotoPreview(null); if (permitFileRef.current) permitFileRef.current.value = '' }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center hover:bg-red-400">x</button>
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => router.push('/dashboard')}
              className="px-5 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-all">
              Cancel
            </button>
            <button type="button" onClick={nextStep} disabled={facilities.length === 0}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-200 active:scale-[0.97]">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: WORKER & NOTIFICATIONS                               */}
      {/* ============================================================ */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Who&apos;s watching?</h3>
            <p className="text-sm text-slate-500 mt-0.5">Assign a fire watcher and set up notifications.</p>
          </div>

          {/* Worker Name */}
          <div>
            <Label required>Fire Watcher Name</Label>
            <input type="text" value={form.assigned_name} onChange={(e) => set('assigned_name', e.target.value)} required placeholder="Full name of the fire watcher" className={inputClass} />
          </div>

          {/* SMS Toggle */}
          <ToggleSwitch
            label="SMS Check-in Reminders"
            description="Send check-in links and alerts via text message"
            enabled={smsEnabled}
            onToggle={() => {
              setSmsEnabled((prev) => {
                if (prev) { setForm((f) => ({ ...f, assigned_phone: '' })); setSmsConsent(false) }
                return !prev
              })
            }}
          >
            <div>
              <Label required>Worker&apos;s Phone</Label>
              <input type="tel" value={form.assigned_phone} onChange={(e) => set('assigned_phone', e.target.value)} onBlur={() => handlePhoneBlur('assigned_phone')}
                required autoComplete="tel" placeholder="+1 (212) 000-0000" className={inputClass} />
              <p className="text-xs text-slate-500 mt-1.5">Include country code. SMS check-in links go here.</p>
            </div>
          </ToggleSwitch>

          {/* Escalation Toggle */}
          <ToggleSwitch
            label="Supervisor Escalation"
            description="Alert a supervisor by SMS when a check-in is missed"
            enabled={escalationEnabled}
            onToggle={toggleEscalation}
          >
            <div>
              <Label required>Supervisor Phone</Label>
              <input type="tel" value={form.escalation_phone} onChange={(e) => set('escalation_phone', e.target.value)} onBlur={() => handlePhoneBlur('escalation_phone')}
                autoComplete="tel" placeholder="+1 (212) 000-0000" className={inputClass} />
            </div>
            <div>
              <Label optional>Backup Supervisor Phone</Label>
              <input type="tel" value={form.secondary_escalation_phone} onChange={(e) => set('secondary_escalation_phone', e.target.value)} onBlur={() => handlePhoneBlur('secondary_escalation_phone')}
                autoComplete="tel" placeholder="+1 (212) 000-0000" className={inputClass} />
              <p className="text-xs text-slate-500 mt-1.5">Notified if primary supervisor doesn&apos;t acknowledge within 3 minutes.</p>
            </div>
            <div>
              <Label>Alert Delay</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: '0', label: 'Immediate' },
                  { value: '15', label: '15 min' },
                  { value: '30', label: '30 min' },
                  { value: '60', label: '1 hr' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center justify-center py-2.5 border-2 rounded-xl cursor-pointer text-xs font-bold transition-all ${
                    form.escalation_delay_min === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}>
                    <input type="radio" className="sr-only" name="escalation_delay_min" value={opt.value} checked={form.escalation_delay_min === opt.value} onChange={() => set('escalation_delay_min', opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">How long after a missed check-in before supervisor is texted.</p>
            </div>
          </ToggleSwitch>

          {/* SMS Consent */}
          {smsEnabled && (
            <div className="border border-blue-200 bg-blue-50 rounded-xl px-5 py-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} className="mt-0.5 rounded accent-blue-600 flex-shrink-0" />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I confirm the worker has agreed to receive automated SMS messages from DutyProof for fire watch reminders and alerts.
                  Msg &amp; data rates may apply. Reply STOP to opt out.{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">Terms</a>
                  {' · '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">Privacy</a>
                  {' · '}
                  <a href="/sms-consent" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">SMS Terms</a>
                </span>
              </label>
            </div>
          )}

          {/* Nav */}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={prevStep}
              className="px-5 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-all">
              Back
            </button>
            <button type="button" onClick={nextStep}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-200 active:scale-[0.97]">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: SCHEDULE & CHECKLIST                                 */}
      {/* ============================================================ */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Set the schedule</h3>
            <p className="text-sm text-slate-500 mt-0.5">Configure timing, intervals, and the pre-watch checklist.</p>
          </div>

          {/* Check-in Interval */}
          <div>
            <Label required>Check-in Interval</Label>
            <PillGroup
              name="check_interval_min"
              value={form.check_interval_min}
              onChange={(v) => set('check_interval_min', v)}
              options={[
                { value: '15', label: '15 min', hint: 'most AHJs' },
                { value: '30', label: '30 min' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
            {form.check_interval_min === 'custom' && (
              <div className="mt-2 flex items-center gap-3">
                <input type="number" value={customInterval} onChange={(e) => setCustomInterval(e.target.value)} min="5" max="120" placeholder="20" className={`${inputClass} w-28`} />
                <span className="text-sm text-slate-500">minutes per round</span>
              </div>
            )}
          </div>

          {/* Start Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label required>Start Time</Label>
              <button type="button" onClick={setNow} className="text-xs text-blue-600 hover:text-blue-500 font-bold transition-colors">Set to Now</button>
            </div>
            <input type="datetime-local" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} required className={inputClass} />
            <p className="text-xs text-slate-500 mt-1.5">{smsEnabled ? 'First SMS will be sent at this time.' : 'Watch begins recording at this time.'}</p>
          </div>

          {/* End Time */}
          <div>
            <Label optional>Expected End Time</Label>
            <input type="datetime-local" value={form.planned_end_time} onChange={(e) => set('planned_end_time', e.target.value)} min={form.start_time} className={inputClass} />
            <p className="text-xs text-slate-500 mt-1.5">For your audit trail. Watch continues until manually ended.</p>
          </div>

          {/* Post-Work Duration */}
          <div>
            <Label>Post-Work Watch Duration</Label>
            <PillGroup
              name="post_work_duration_min"
              value={form.post_work_duration_min}
              onChange={(v) => set('post_work_duration_min', v)}
              options={[
                { value: '30', label: '30 min', hint: 'NFPA default' },
                { value: '60', label: '60 min' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
            {form.post_work_duration_min === 'custom' && (
              <div className="mt-2 flex items-center gap-3">
                <input type="number" value={customPostWork} onChange={(e) => setCustomPostWork(e.target.value)} min="5" max="480" placeholder="45" className={`${inputClass} w-28`} />
                <span className="text-sm text-slate-500">minutes after work stops</span>
              </div>
            )}
          </div>

          {/* Pre-Watch Checklist */}
          <ToggleSwitch
            label="Pre-Watch Safety Checklist"
            description="Worker completes safety items via link before rounds begin"
            enabled={checklistEnabled}
            onToggle={() => setChecklistEnabled((v) => !v)}
          >
            {/* Quick Add */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Add</p>
                {activePresets.some((p) => !checklistItems.some((i) => i.label === p.label)) && (
                  <button type="button" onClick={() => {
                    const toAdd = activePresets.filter((p) => !checklistItems.some((i) => i.label === p.label))
                    setChecklistItems((prev) => [...prev, ...toAdd])
                  }} className="text-[10px] font-bold text-blue-600 hover:text-blue-500 transition-colors">
                    + Add all ({activePresets.filter((p) => !checklistItems.some((i) => i.label === p.label)).length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {activePresets.map((preset) => {
                  const added = checklistItems.some((i) => i.label === preset.label)
                  return (
                    <button key={preset.label} type="button" onClick={() => addPreset(preset)} disabled={added} title={preset.label}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        added ? 'border-green-200 bg-green-50 text-green-700 cursor-default' : 'border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600'
                      }`}>
                      {added ? '\u2713 ' : '+ '}{preset.shortLabel}{preset.requires_photo && <span className="ml-1 text-blue-500">\ud83d\udcf7</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Current items */}
            {checklistItems.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Checklist ({checklistItems.length} item{checklistItems.length !== 1 ? 's' : ''})</p>
                <div className="space-y-2">
                  {checklistItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">{item.label}</p>
                        {item.requires_photo && <span className="text-[10px] text-blue-600 font-semibold">\ud83d\udcf7 Photo required</span>}
                      </div>
                      <button type="button" onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-400 text-xl leading-none mt-0.5 flex-shrink-0">\u00d7</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add custom */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Custom Item</p>
              <div className="flex gap-2">
                <input type="text" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomItem() } }}
                  placeholder="Describe the safety check..." className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={addCustomItem} className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors">Add</button>
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={newItemPhoto} onChange={(e) => setNewItemPhoto(e.target.checked)} className="rounded accent-blue-600" />
                <span className="text-xs text-slate-500">Require photo for this item</span>
              </label>
            </div>

            {checklistItems.length === 0 && (
              <p className="text-xs text-amber-600 text-center">Add at least one item above, or disable the checklist toggle.</p>
            )}
          </ToggleSwitch>

          {/* Nav */}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={prevStep}
              className="px-5 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-all">
              Back
            </button>
            <button type="button" onClick={nextStep} disabled={checklistBlocking}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-200 active:scale-[0.97]">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 4: REVIEW & CONFIRM                                     */}
      {/* ============================================================ */}
      {step === 4 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Review & Start</h3>
            <p className="text-sm text-slate-500 mt-0.5">Double-check everything before starting the watch.</p>
          </div>

          {/* Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
            {/* Location */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-blue-600 hover:text-blue-500">Edit</button>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">{selectedFacility?.name || '—'}</p>
              {form.location && <p className="text-xs text-slate-500">{form.location}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {form.watch_type === 'hot_work' ? 'Hot Work' : 'Impairment'}
                </span>
                {geofenceEnabled && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Geofence On</span>}
                {form.reason && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{form.reason}</span>}
                {form.permit_number && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Permit: {form.permit_number}</span>}
              </div>
            </div>

            {/* Worker */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Worker</p>
                <button type="button" onClick={() => setStep(2)} className="text-[10px] font-bold text-blue-600 hover:text-blue-500">Edit</button>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">{form.assigned_name || '—'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {smsEnabled ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">SMS: {form.assigned_phone}</span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">No SMS</span>
                )}
                {escalationEnabled && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Escalation: {form.escalation_phone}</span>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule</p>
                <button type="button" onClick={() => setStep(3)} className="text-[10px] font-bold text-blue-600 hover:text-blue-500">Edit</button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">Interval</p>
                  <p className="text-sm font-bold text-slate-900">{getIntervalLabel()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">Post-Work</p>
                  <p className="text-sm font-bold text-slate-900">{getPostWorkLabel()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">Starts</p>
                  <p className="text-sm font-bold text-slate-900">{form.start_time ? new Date(form.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}</p>
                </div>
                {form.planned_end_time && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">Expected End</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(form.planned_end_time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                )}
              </div>
              {checklistEnabled && (
                <div className="mt-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Checklist: {checklistItems.length} item{checklistItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
            <p className="text-xs font-bold text-blue-700 mb-1.5">What happens when you start:</p>
            <ul className="text-xs text-blue-600 space-y-1">
              {smsEnabled && checklistEnabled && checklistItems.length > 0 && (
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">1.</span> Safety checklist SMS sent to {form.assigned_name}</li>
              )}
              {smsEnabled && checklistEnabled && checklistItems.length > 0 && (
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">2.</span> First check-in SMS sent after checklist is completed</li>
              )}
              {smsEnabled && !checklistEnabled && (
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">1.</span> First check-in SMS sent immediately to {form.assigned_name}</li>
              )}
              {!smsEnabled && (
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">1.</span> Watch starts in manual monitoring mode (no SMS)</li>
              )}
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">{smsEnabled && checklistEnabled ? '3' : '2'}.</span> Check-ins every {getIntervalLabel()}</li>
            </ul>
          </div>

          {/* Nav */}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={prevStep}
              className="px-5 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-all">
              Back
            </button>
            <button type="button" onClick={handleSubmit}
              disabled={loading || facilities.length === 0 || checklistBlocking || (smsEnabled && !smsConsent)}
              className="flex-1 py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-green-200 active:scale-[0.97]">
              {loading ? 'Starting Watch...' : 'Start Watch'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
