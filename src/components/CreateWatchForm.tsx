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

// ===== STEP ICONS =====
const StepIcons = {
  location: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  worker: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  schedule: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  review: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
}

// ===== STEP INDICATOR =====
function StepIndicator({ current, total, labels, onStepClick }: {
  current: number; total: number; labels: string[]; onStepClick: (step: number) => void
}) {
  const icons = [StepIcons.location, StepIcons.worker, StepIcons.schedule, StepIcons.review]
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1
          const isActive = step === current
          const isDone = step < current
          const isClickable = isDone
          return (
            <button
              key={step}
              type="button"
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              className={`flex items-center gap-2 ${isClickable ? 'cursor-pointer' : 'cursor-default'} group`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200' :
                isDone ? 'bg-emerald-500 text-white group-hover:bg-emerald-400' :
                'bg-slate-100 text-slate-300'
              }`}>
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                ) : icons[i]}
              </div>
              <span className={`text-[11px] font-bold transition-colors hidden sm:inline ${
                isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-slate-300'
              }`}>
                {labels[i]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ===== SECTION HEADER =====
function SectionHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
        <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

// ===== TOGGLE SWITCH =====
function ToggleSwitch({ label, description, enabled, onToggle, recommended, children }: {
  label: string; description: string; enabled: boolean; onToggle: () => void; recommended?: boolean; children?: React.ReactNode
}) {
  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all duration-200 ${
      enabled ? 'border-blue-200 shadow-sm shadow-blue-100/50' : 'border-slate-100 hover:border-slate-200'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50/50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-800">{label}</p>
            {recommended && (
              <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Recommended</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        <div aria-hidden="true" className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ml-4 ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
          <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </div>
      </button>
      {enabled && children && (
        <div className="border-t border-blue-100 px-5 py-5 bg-gradient-to-b from-blue-50/30 to-white space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ===== PILL GROUP =====
function PillGroup({ options, value, onChange, name }: {
  options: { value: string; label: string; hint?: string }[]
  value: string; onChange: (v: string) => void; name: string
}) {
  return (
    <div className="flex gap-2.5">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex-1 flex flex-col items-center justify-center py-3.5 gap-0.5 border-2 rounded-2xl cursor-pointer transition-all duration-200 select-none active:scale-[0.97] focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 ${
            value === opt.value
              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
              : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-500'
          }`}
        >
          <input type="radio" className="sr-only" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} />
          <span className="font-bold text-sm">{opt.label}</span>
          {opt.hint && <span className={`text-[10px] ${value === opt.value ? 'text-blue-500' : 'text-slate-300'}`}>{opt.hint}</span>}
        </label>
      ))}
    </div>
  )
}

// ===== LABEL =====
function Label({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 normal-case font-normal ml-1">(optional)</span>}
    </label>
  )
}

// ===== INPUT FIELD WITH VALIDATION =====
function Field({ value, valid, children }: { value: string; valid?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      {valid !== undefined && value.length > 0 && (
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center ${
          valid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
        }`}>
          {valid ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          )}
        </div>
      )}
    </div>
  )
}

// ===== NAV BUTTONS =====
function NavButtons({ onBack, onNext, nextLabel, nextDisabled, loading, nextColor }: {
  onBack?: () => void; onNext: () => void; nextLabel: string; nextDisabled?: boolean; loading?: boolean; nextColor?: 'blue' | 'green'
}) {
  const color = nextColor === 'green'
    ? 'bg-green-600 hover:bg-green-500 shadow-green-200 disabled:bg-slate-200'
    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-200 disabled:bg-slate-200'
  return (
    <div className="pt-6 flex gap-3">
      {onBack && (
        <button type="button" onClick={onBack}
          className="group flex items-center gap-2 px-5 py-3.5 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-semibold rounded-2xl text-sm transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back
        </button>
      )}
      <button type="button" onClick={onNext} disabled={nextDisabled || loading}
        className={`flex-1 group flex items-center justify-center gap-2 py-3.5 ${color} disabled:text-slate-400 text-white font-bold rounded-2xl text-sm transition-all shadow-lg active:scale-[0.97] disabled:shadow-none`}>
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Starting...
          </span>
        ) : (
          <>
            {nextLabel}
            {nextColor !== 'green' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            )}
          </>
        )}
      </button>
    </div>
  )
}

// ===== REVIEW ROW =====
function ReviewRow({ label, value, tags, onEdit }: {
  label: string; value?: string | null; tags?: { text: string; color: string }[]; onEdit: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        {value && <p className="text-sm font-semibold text-slate-900 leading-snug">{value}</p>}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {tags.map((t, i) => (
              <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.color}`}>{t.text}</span>
            ))}
          </div>
        )}
      </div>
      <button type="button" onClick={onEdit}
        className="text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0 mt-0.5">
        Edit
      </button>
    </div>
  )
}


// =============================================================================
// MAIN COMPONENT
// =============================================================================

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
  const [escalationEnabled, setEscalationEnabled] = useState(true)
  const [checklistEnabled, setChecklistEnabled] = useState(false)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemPhoto, setNewItemPhoto] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [smsConsent, setSmsConsent] = useState(false)
  const [escalationSmsEnabled, setEscalationSmsEnabled] = useState(false)
  const [escalationSmsConsent, setEscalationSmsConsent] = useState(false)
  const [permitPhotoFile, setPermitPhotoFile] = useState<File | null>(null)
  const [permitPhotoPreview, setPermitPhotoPreview] = useState<string | null>(null)
  const permitFileRef = useRef<HTMLInputElement>(null)
  const [recentWatchers, setRecentWatchers] = useState<{ name: string; phone: string }[]>([])
  const [showWatcherSuggestions, setShowWatcherSuggestions] = useState(false)
  const [recentSupervisors, setRecentSupervisors] = useState<string[]>([])
  const [showSupervisorSuggestions, setShowSupervisorSuggestions] = useState(false)
  const [geofenceEnabled, setGeofenceEnabled] = useState(false)
  const [watchLatitude, setWatchLatitude] = useState<number | null>(null)
  const [watchLongitude, setWatchLongitude] = useState<number | null>(null)
  const [watchRadiusM, setWatchRadiusM] = useState(100)
  const [customRadius, setCustomRadius] = useState('300')
  const [showChecklistDetail, setShowChecklistDetail] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('facilities').select('*').order('name').then(({ data, error }) => {
      if (error) toast.error('Failed to load job sites. Please refresh.')
      else if (data) setFacilities(data)
    })
    // Load recent watchers & supervisors for autocomplete
    supabase.from('watches').select('assigned_name, assigned_phone, escalation_phone, secondary_escalation_phone').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
      if (data) {
        const seen = new Set<string>()
        const unique: { name: string; phone: string }[] = []
        for (const w of data) {
          const key = w.assigned_name.toLowerCase()
          if (!seen.has(key) && w.assigned_name.trim()) {
            seen.add(key)
            unique.push({ name: w.assigned_name, phone: w.assigned_phone || '' })
          }
        }
        setRecentWatchers(unique.slice(0, 10))

        // Unique supervisor phones
        const phoneSeen = new Set<string>()
        const phones: string[] = []
        for (const w of data) {
          for (const p of [w.escalation_phone, w.secondary_escalation_phone]) {
            if (p && p.trim() && !phoneSeen.has(p)) {
              phoneSeen.add(p)
              phones.push(p)
            }
          }
        }
        setRecentSupervisors(phones.slice(0, 8))
      }
    })
  }, [])

  useEffect(() => { return () => { if (permitPhotoPreview) URL.revokeObjectURL(permitPhotoPreview) } }, [permitPhotoPreview])

  function set(field: string, value: string) { setForm((prev) => ({ ...prev, [field]: value })) }

  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10) return `+1${digits}`
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
    if (raw.trim().startsWith('+')) return `+${digits}`
    return raw.trim()
  }

  function handlePhoneBlur(field: 'assigned_phone' | 'escalation_phone' | 'secondary_escalation_phone') {
    const value = form[field]
    if (value.trim()) setForm((prev) => ({ ...prev, [field]: normalizePhone(value) }))
  }

  function isValidPhone(v: string) { return /^\+?[\d\s\-().]{10,}$/.test(v) }

  function setNow() { setForm((prev) => ({ ...prev, start_time: toLocalDatetimeValue(new Date()) })) }

  function toggleEscalation() {
    setEscalationEnabled((prev) => {
      if (prev) setForm((f) => ({ ...f, escalation_phone: '', escalation_delay_min: '0', secondary_escalation_phone: '' }))
      return !prev
    })
  }

  function getActivePresets(): ChecklistItem[] { return form.watch_type === 'impairment' ? IMPAIRMENT_PRESET_ITEMS : PRESET_ITEMS }

  function handleWatchTypeChange(newType: 'hot_work' | 'impairment') {
    if (newType === form.watch_type) return
    setForm((prev) => ({ ...prev, watch_type: newType }))
    setChecklistItems([])
  }

  function addAllPresets() {
    const toAdd = getActivePresets().filter((p) => !checklistItems.some((i) => i.label === p.label))
    setChecklistItems((prev) => [...prev, ...toAdd])
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

  function removeItem(index: number) { setChecklistItems((prev) => prev.filter((_, i) => i !== index)) }

  function handlePermitPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPermitPhotoFile(file)
    if (permitPhotoPreview) URL.revokeObjectURL(permitPhotoPreview)
    setPermitPhotoPreview(file ? URL.createObjectURL(file) : null)
  }

  const inputClass = 'w-full px-4 py-3.5 border-2 border-slate-100 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-sm placeholder:text-slate-300'

  // ===== STEP VALIDATION =====
  function canAdvance(s: number): boolean {
    if (s === 1) {
      if (!form.facility_id) { toast.error('Please select a job site'); return false }
      return true
    }
    if (s === 2) {
      if (!form.assigned_name.trim()) { toast.error('Please enter the fire watcher name'); return false }
      if (smsEnabled && !isValidPhone(form.assigned_phone)) { toast.error('Please enter a valid watcher phone number'); return false }
      if (escalationSmsEnabled && !isValidPhone(form.escalation_phone)) { toast.error('Please enter a valid supervisor phone number'); return false }
      if (escalationSmsEnabled && form.secondary_escalation_phone.trim() && !isValidPhone(form.secondary_escalation_phone)) { toast.error('Please enter a valid backup phone number'); return false }
      return true
    }
    if (s === 3) {
      if (form.check_interval_min === 'custom') {
        const val = parseInt(customInterval)
        if (!customInterval || isNaN(val) || val < 5 || val > 120) { toast.error('Custom interval must be 5-120 minutes'); return false }
      }
      if (form.post_work_duration_min === 'custom') {
        const val = parseInt(customPostWork)
        if (!customPostWork || isNaN(val) || val < 5 || val > 480) { toast.error('Custom post-work duration must be 5-480 minutes'); return false }
      }
      if (form.planned_end_time && form.planned_end_time <= form.start_time) { toast.error('End time must be after start time'); return false }
      return true
    }
    return true
  }

  function nextStep() { if (canAdvance(step)) setStep((s) => Math.min(s + 1, 4)) }
  function prevStep() { setStep((s) => Math.max(s - 1, 1)) }
  function goToStep(s: number) { if (s < step) setStep(s) }

  // ===== SUBMIT =====
  async function handleSubmit() {
    if (loading) return
    if (!canAdvance(1) || !canAdvance(2) || !canAdvance(3)) return
    if (checklistEnabled && checklistItems.length === 0) { toast.error('Add at least one checklist item, or disable the checklist'); return }
    if (smsEnabled && !smsConsent) { toast.error('Please confirm SMS consent for watcher'); return }
    if (escalationSmsEnabled && !escalationSmsConsent) { toast.error('Please confirm SMS consent for supervisor escalation'); return }

    const resolvedInterval = form.check_interval_min === 'custom' ? parseInt(customInterval) : parseInt(form.check_interval_min)
    const resolvedPostWork = form.post_work_duration_min === 'custom' ? parseInt(customPostWork) : parseInt(form.post_work_duration_min)

    setLoading(true)
    try {
      let permit_photo_url: string | null = null
      if (permitPhotoFile) {
        const fd = new FormData()
        fd.append('file', permitPhotoFile)
        const uploadRes = await fetch('/api/watches/upload-permit', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload permit photo')
        permit_photo_url = uploadData.photo_url
      }

      const res = await fetch('/api/watches/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          permit_number: form.permit_number || null,
          permit_photo_url,
          post_work_duration_min: resolvedPostWork,
          assigned_phone: smsEnabled ? form.assigned_phone : null,
          sms_enabled: smsEnabled,
          check_interval_min: resolvedInterval,
          escalation_phone: escalationSmsEnabled ? form.escalation_phone : null,
          secondary_escalation_phone: escalationSmsEnabled && form.secondary_escalation_phone.trim() ? form.secondary_escalation_phone : null,
          escalation_delay_min: escalationSmsEnabled ? parseInt(form.escalation_delay_min) : 0,
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
        'Watch started! You can print a watch sheet from the detail page.',
        { duration: 6000 }
      )
      router.push('/watches/' + data.watchId)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start watch')
    } finally {
      setLoading(false)
    }
  }

  const checklistBlocking = checklistEnabled && checklistItems.length === 0
  const activePresets = getActivePresets()
  const allPresetsAdded = activePresets.every((p) => checklistItems.some((i) => i.label === p.label))
  const TOTAL_STEPS = 4
  const stepLabels = ['Location', 'Watcher', 'Schedule', 'Review']
  const selectedFacility = facilities.find((f) => f.id === form.facility_id)

  function getIntervalLabel(): string { return form.check_interval_min === 'custom' ? `${customInterval} min` : `${form.check_interval_min} min` }
  function getPostWorkLabel(): string { return form.post_work_duration_min === 'custom' ? `${customPostWork} min` : `${form.post_work_duration_min} min` }

  return (
    <div>
      <StepIndicator current={step} total={TOTAL_STEPS} labels={stepLabels} onStepClick={goToStep} />

      {/* ================================================================ */}
      {/* STEP 1: LOCATION & TYPE                                         */}
      {/* ================================================================ */}
      {step === 1 && (
        <div className="space-y-5">
          <SectionHeader title="What are you watching?" subtitle="Select the type of watch and where it's happening." icon={StepIcons.location} />

          <div>
            <Label required>Watch Type</Label>
            <PillGroup name="watch_type" value={form.watch_type} onChange={(v) => handleWatchTypeChange(v as 'hot_work' | 'impairment')} options={[
              { value: 'hot_work', label: 'Hot Work', hint: 'NFPA 51B' },
              { value: 'impairment', label: 'Impairment', hint: 'NFPA 25' },
            ]} />
          </div>

          <div>
            <Label required>Job Site</Label>
            {facilities.length === 0 ? (
              <div className="text-sm text-amber-700 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                No job sites yet.{' '}<a href="/facilities" className="text-blue-600 hover:underline font-semibold">Add a job site first.</a>
              </div>
            ) : (
              <Field value={form.facility_id} valid={form.facility_id.length > 0}>
                <select value={form.facility_id} onChange={(e) => set('facility_id', e.target.value)} required className={`${inputClass} bg-white pr-10`}>
                  <option value="">Select job site...</option>
                  {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div>
            <Label optional>Location / Area</Label>
            <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Building D, Bay 2, Roof Level" className={inputClass} />
          </div>

          <ToggleSwitch label="Set Watch Location" description="Drop a pin on the map for geofence tracking" recommended enabled={geofenceEnabled} onToggle={() => {
            setGeofenceEnabled((prev) => { if (prev) { setWatchLatitude(null); setWatchLongitude(null); setWatchRadiusM(100) }; return !prev })
          }}>
            <LocationPickerDynamic latitude={watchLatitude} longitude={watchLongitude} radius={watchRadiusM}
              onChange={({ latitude, longitude }) => { setWatchLatitude(latitude); setWatchLongitude(longitude) }} />
            <div>
              <Label>Geofence Radius</Label>
              <div className="flex gap-2 flex-wrap">
                {[{ value: 50, label: '50m' }, { value: 100, label: '100m' }, { value: 200, label: '200m' }, { value: 500, label: '500m' }, { value: -1, label: 'Custom' }].map((opt) => (
                  <label key={opt.value} className={`flex items-center justify-center py-2.5 px-4 border-2 rounded-xl cursor-pointer transition-all text-sm font-bold ${
                    (opt.value === -1 ? ![50, 100, 200, 500].includes(watchRadiusM) : watchRadiusM === opt.value)
                      ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}>
                    <input type="radio" className="sr-only" name="watch_radius" checked={opt.value === -1 ? ![50, 100, 200, 500].includes(watchRadiusM) : watchRadiusM === opt.value}
                      onChange={() => { if (opt.value === -1) setWatchRadiusM(parseInt(customRadius) || 300); else setWatchRadiusM(opt.value) }} />
                    {opt.label}
                  </label>
                ))}
              </div>
              {![50, 100, 200, 500].includes(watchRadiusM) && (
                <div className="mt-2 flex items-center gap-3">
                  <input type="number" value={customRadius} onChange={(e) => { setCustomRadius(e.target.value); const v = parseInt(e.target.value); if (v >= 10 && v <= 5000) setWatchRadiusM(v) }}
                    min="10" max="5000" placeholder="300" className={`${inputClass} w-28`} />
                  <span className="text-sm text-slate-400">meters</span>
                </div>
              )}
            </div>
          </ToggleSwitch>

          <div>
            <Label optional>Reason for Watch</Label>
            <input type="text" value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="e.g. Post-weld watch - pipe cutting Bay 3" className={inputClass} />
          </div>

          {/* Permit section — collapsible to reduce noise */}
          <details className="group border-2 border-slate-100 rounded-2xl overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors list-none">
              <div className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-sm font-semibold text-slate-600">Permit Details</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Optional</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 transition-transform group-open:rotate-180"><path d="M6 9l6 6 6-6" /></svg>
            </summary>
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label optional>Permit Number</Label>
                  <input type="text" value={form.permit_number} onChange={(e) => set('permit_number', e.target.value)} maxLength={100} placeholder="e.g. HWP-2026-0042" className={inputClass} />
                </div>
                <div>
                  <Label optional>Permit Photo</Label>
                  <input ref={permitFileRef} type="file" accept="image/*" onChange={handlePermitPhotoSelect} className="hidden" />
                  {permitPhotoPreview ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={permitPhotoPreview} alt="Permit preview" className="w-14 h-14 object-cover rounded-xl border-2 border-slate-100" />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => permitFileRef.current?.click()} className="text-xs text-blue-600 font-semibold hover:text-blue-500">Change</button>
                        <button type="button" onClick={() => { setPermitPhotoFile(null); if (permitPhotoPreview) URL.revokeObjectURL(permitPhotoPreview); setPermitPhotoPreview(null); if (permitFileRef.current) permitFileRef.current.value = '' }}
                          className="text-xs text-red-500 font-semibold hover:text-red-400">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => permitFileRef.current?.click()}
                      className="w-full px-4 py-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all font-medium flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                      Upload Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </details>

          <NavButtons onBack={() => router.push('/dashboard')} onNext={nextStep} nextLabel="Continue" nextDisabled={facilities.length === 0} />
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 2: WORKER & NOTIFICATIONS                                  */}
      {/* ================================================================ */}
      {step === 2 && (
        <div className="space-y-5">
          <SectionHeader title="Who's watching?" subtitle="Assign your fire watcher and set up notifications." icon={StepIcons.worker} />

          <div className="relative">
            <Label required>Fire Watcher Name</Label>
            <Field value={form.assigned_name} valid={form.assigned_name.trim().length >= 2}>
              <input type="text" value={form.assigned_name}
                onChange={(e) => { set('assigned_name', e.target.value); setShowWatcherSuggestions(true) }}
                onFocus={() => setShowWatcherSuggestions(true)}
                onBlur={() => setTimeout(() => setShowWatcherSuggestions(false), 150)}
                required placeholder="Full name of the fire watcher" className={inputClass} autoComplete="off" />
            </Field>
            {/* Recent watcher suggestions */}
            {showWatcherSuggestions && recentWatchers.length > 0 && form.assigned_name.length < 3 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-lg overflow-hidden">
                <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recent Watchers</p>
                {recentWatchers.map((w, i) => (
                  <button key={i} type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setForm((prev) => ({ ...prev, assigned_name: w.name, assigned_phone: w.phone || prev.assigned_phone }))
                      setShowWatcherSuggestions(false)
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-semibold text-slate-700">{w.name}</span>
                    {w.phone && <span className="text-[11px] text-slate-400">{w.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ToggleSwitch label="SMS Check-in Reminders" description="Send check-in links and alerts via text message" enabled={smsEnabled}
            onToggle={() => { setSmsEnabled((prev) => { if (prev) { setForm((f) => ({ ...f, assigned_phone: '' })); setSmsConsent(false) }; return !prev }) }}>
            <div>
              <Label required>Watcher&apos;s Phone</Label>
              <Field value={form.assigned_phone} valid={isValidPhone(form.assigned_phone)}>
                <input type="tel" value={form.assigned_phone} onChange={(e) => set('assigned_phone', e.target.value)} onBlur={() => handlePhoneBlur('assigned_phone')}
                  required autoComplete="tel" placeholder="+1 (555) 000-0000" className={inputClass} />
              </Field>
              <p className="text-xs text-slate-500 mt-1.5">Include country code. Check-in links go here.</p>
            </div>
          </ToggleSwitch>

          {/* Supervisor SMS Escalation — optional */}
          <ToggleSwitch label="SMS Supervisor Escalation" description="Send missed check-in alerts to a supervisor via text message (optional)" enabled={escalationSmsEnabled} recommended
            onToggle={() => { setEscalationSmsEnabled((prev) => { if (prev) { setForm((f) => ({ ...f, escalation_phone: '', secondary_escalation_phone: '' })); setEscalationSmsConsent(false) }; return !prev }) }}>
            <div className="relative">
              <Label required>Supervisor Phone</Label>
              <Field value={form.escalation_phone} valid={isValidPhone(form.escalation_phone)}>
                <input type="tel" value={form.escalation_phone}
                  onChange={(e) => { set('escalation_phone', e.target.value); setShowSupervisorSuggestions(true) }}
                  onFocus={() => setShowSupervisorSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSupervisorSuggestions(false), 150)}
                  autoComplete="off" placeholder="+1 (555) 000-0000" className={inputClass} />
              </Field>
              {showSupervisorSuggestions && recentSupervisors.length > 0 && !form.escalation_phone.trim() && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-lg overflow-hidden">
                  <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recent Supervisors</p>
                  {recentSupervisors.map((phone, i) => (
                    <button key={i} type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setForm((prev) => ({ ...prev, escalation_phone: phone }))
                        setShowSupervisorSuggestions(false)
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-700">{phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label optional>Backup Supervisor Phone</Label>
              <Field value={form.secondary_escalation_phone} valid={!form.secondary_escalation_phone.trim() || isValidPhone(form.secondary_escalation_phone)}>
                <input type="tel" value={form.secondary_escalation_phone} onChange={(e) => set('secondary_escalation_phone', e.target.value)} onBlur={() => handlePhoneBlur('secondary_escalation_phone')}
                  autoComplete="tel" placeholder="+1 (555) 000-0000" className={inputClass} />
              </Field>
              <p className="text-xs text-slate-500 mt-1.5">Notified if primary doesn&apos;t respond within 3 min.</p>
            </div>
            <div>
              <Label>Alert Delay</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[{ value: '0', label: 'Immediate' }, { value: '15', label: '15 min' }, { value: '30', label: '30 min' }, { value: '60', label: '1 hr' }].map((opt) => (
                  <label key={opt.value} className={`flex items-center justify-center py-3 border-2 rounded-2xl cursor-pointer text-xs font-bold transition-all select-none active:scale-[0.97] ${
                    form.escalation_delay_min === opt.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}>
                    <input type="radio" className="sr-only" name="escalation_delay_min" value={opt.value} checked={form.escalation_delay_min === opt.value} onChange={() => set('escalation_delay_min', opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </ToggleSwitch>

          {/* Escalation SMS consent */}
          {escalationSmsEnabled && (
            <div className="border-2 border-amber-100 bg-amber-50/50 rounded-2xl px-5 py-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={escalationSmsConsent} onChange={(e) => setEscalationSmsConsent(e.target.checked)} className="mt-1 rounded accent-amber-600 flex-shrink-0 w-4 h-4" />
                <span className="text-sm text-slate-600 leading-relaxed">
                  I consent to receive missed check-in alert SMS messages at the supervisor phone number provided above. Message &amp; data rates may apply. I can reply STOP to opt out at any time or HELP for assistance. SMS escalation is not required to use DutyProof.{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">Terms</a>
                  {' · '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">Privacy</a>
                  {' · '}
                  <a href="/sms-consent" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">SMS Terms</a>
                </span>
              </label>
            </div>
          )}

          {/* Watcher SMS consent */}
          {smsEnabled && (
            <div className="border-2 border-blue-100 bg-blue-50/50 rounded-2xl px-5 py-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} className="mt-1 rounded accent-blue-600 flex-shrink-0 w-4 h-4" />
                <span className="text-sm text-slate-600 leading-relaxed">
                  I authorize DutyProof to send a one-time SMS consent request to the watcher at the number provided. The watcher must confirm directly before any operational messages are sent. Message &amp; data rates may apply. The watcher can reply STOP to opt out at any time or HELP for assistance. SMS is not required to use DutyProof.{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">Terms</a>
                  {' · '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">Privacy</a>
                  {' · '}
                  <a href="/sms-consent" target="_blank" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">SMS Terms</a>
                </span>
              </label>
            </div>
          )}

          <NavButtons onBack={prevStep} onNext={nextStep} nextLabel="Continue" />
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 3: SCHEDULE & CHECKLIST                                    */}
      {/* ================================================================ */}
      {step === 3 && (
        <div className="space-y-5">
          <SectionHeader title="Set the schedule" subtitle="Configure timing, intervals, and the pre-watch checklist." icon={StepIcons.schedule} />

          <div>
            <Label required>Check-in Interval</Label>
            <PillGroup name="check_interval_min" value={form.check_interval_min} onChange={(v) => set('check_interval_min', v)} options={[
              { value: '15', label: '15 min', hint: 'most AHJs' },
              { value: '30', label: '30 min' },
              { value: 'custom', label: 'Custom' },
            ]} />
            {form.check_interval_min === 'custom' && (
              <div className="mt-3 flex items-center gap-3">
                <input type="number" value={customInterval} onChange={(e) => setCustomInterval(e.target.value)} min="5" max="120" placeholder="20" className={`${inputClass} w-28`} />
                <span className="text-sm text-slate-400">minutes per round</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label required>Start Time</Label>
              <button type="button" onClick={setNow} className="text-xs text-blue-600 hover:text-blue-500 font-bold transition-colors flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                Now
              </button>
            </div>
            <input type="datetime-local" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} required className={inputClass} />
            <p className="text-[11px] text-slate-400 mt-1.5">{smsEnabled ? 'First SMS will be sent at this time.' : 'Watch begins recording at this time.'}</p>
          </div>

          <div>
            <Label optional>Expected End Time</Label>
            <input type="datetime-local" value={form.planned_end_time} onChange={(e) => set('planned_end_time', e.target.value)} min={form.start_time} className={inputClass} />
            <p className="text-[11px] text-slate-400 mt-1.5">For your audit trail. Watch continues until manually ended.</p>
          </div>

          <div>
            <Label>Post-Work Watch Duration</Label>
            <PillGroup name="post_work_duration_min" value={form.post_work_duration_min} onChange={(v) => set('post_work_duration_min', v)} options={[
              { value: '30', label: '30 min', hint: 'NFPA default' },
              { value: '60', label: '60 min' },
              { value: 'custom', label: 'Custom' },
            ]} />
            {form.post_work_duration_min === 'custom' && (
              <div className="mt-3 flex items-center gap-3">
                <input type="number" value={customPostWork} onChange={(e) => setCustomPostWork(e.target.value)} min="5" max="480" placeholder="45" className={`${inputClass} w-28`} />
                <span className="text-sm text-slate-400">minutes after work stops</span>
              </div>
            )}
          </div>

          {/* Pre-Watch Checklist */}
          <ToggleSwitch label="Pre-Watch Safety Checklist" description="Watcher completes safety items via link before rounds begin" recommended enabled={checklistEnabled}
            onToggle={() => setChecklistEnabled((v) => !v)}>

            {/* Smart Add All Button */}
            {!allPresetsAdded && (
              <button type="button" onClick={addAllPresets}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-white border-2 border-blue-200 hover:border-blue-300 rounded-2xl transition-all group active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6M9 15h6" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">
                      Add all {form.watch_type === 'hot_work' ? 'NFPA 51B' : 'NFPA 25'} items
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {activePresets.filter((p) => !checklistItems.some((i) => i.label === p.label)).length} standard safety checks
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                </div>
              </button>
            )}

            {/* Individual presets (collapsed by default) */}
            {!allPresetsAdded && (
              <div>
                <button type="button" onClick={() => setShowChecklistDetail(!showChecklistDetail)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-500 transition-colors uppercase tracking-widest">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform ${showChecklistDetail ? 'rotate-90' : ''}`}><path d="M9 18l6-6-6-6" /></svg>
                  Or add individually
                </button>
                {showChecklistDetail && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activePresets.map((preset) => {
                      const added = checklistItems.some((i) => i.label === preset.label)
                      return (
                        <button key={preset.label} type="button" onClick={() => addPreset(preset)} disabled={added} title={preset.label}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                            added ? 'border-green-200 bg-green-50 text-green-600' : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600'
                          }`}>
                          {added ? '✓ ' : '+ '}{preset.shortLabel}{preset.requires_photo && ' 📷'}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Current checklist items */}
            {checklistItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    {checklistItems.length} item{checklistItems.length !== 1 ? 's' : ''} added
                  </p>
                  {checklistItems.length > 0 && (
                    <button type="button" onClick={() => setChecklistItems([])} className="text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors">Clear all</button>
                  )}
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {checklistItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl px-3 py-2.5 group">
                      <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-slate-700 leading-snug truncate">{item.shortLabel}</p>
                      </div>
                      {item.requires_photo && (
                        <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">PHOTO</span>
                      )}
                      <button type="button" onClick={() => removeItem(i)} className="text-slate-200 hover:text-red-400 text-lg leading-none flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom item */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Add Custom Item</p>
              <div className="flex gap-2">
                <input type="text" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomItem() } }}
                  placeholder="Describe the safety check..." className={`flex-1 ${inputClass}`} />
                <button type="button" onClick={addCustomItem} disabled={!newItemLabel.trim()}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-2xl transition-all active:scale-[0.97]">Add</button>
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={newItemPhoto} onChange={(e) => setNewItemPhoto(e.target.checked)} className="rounded accent-blue-600 w-3.5 h-3.5" />
                <span className="text-xs text-slate-400">Require photo for this item</span>
              </label>
            </div>

            {checklistItems.length === 0 && (
              <div className="text-center py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-600 font-medium">Add at least one item, or disable the checklist.</p>
              </div>
            )}
          </ToggleSwitch>

          <NavButtons onBack={prevStep} onNext={nextStep} nextLabel="Review" nextDisabled={checklistBlocking} />
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 4: REVIEW & CONFIRM                                        */}
      {/* ================================================================ */}
      {step === 4 && (
        <div className="space-y-5">
          <SectionHeader title="Review & start" subtitle="Double-check everything before starting the watch." icon={StepIcons.review} />

          {/* Summary Card */}
          <div className="border-2 border-slate-100 rounded-2xl overflow-hidden">
            {/* Hero summary header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedFacility?.name || '—'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {form.location && <span className="text-slate-400 text-xs">{form.location}</span>}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                      {form.watch_type === 'hot_work' ? 'Hot Work' : 'Impairment'}
                    </span>
                    {geofenceEnabled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Geofence</span>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => setStep(1)}
                  className="text-[10px] font-bold text-white/50 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors">
                  Edit
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              <div className="px-6 py-4">
                <ReviewRow label="Fire Watcher" onEdit={() => setStep(2)}
                  value={form.assigned_name || '—'}
                  tags={[
                    smsEnabled ? { text: `SMS: ${form.assigned_phone}`, color: 'bg-emerald-50 text-emerald-700' } : { text: 'Link only', color: 'bg-slate-100 text-slate-400' },
                    escalationSmsEnabled ? { text: `Escalation SMS: ${form.escalation_phone}`, color: 'bg-amber-50 text-amber-700' } : { text: 'Escalation: email only', color: 'bg-slate-100 text-slate-400' },
                  ]}
                />
              </div>
              <div className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Schedule</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                          <p className="text-[10px] text-slate-400 font-bold">End</p>
                          <p className="text-sm font-bold text-slate-900">{new Date(form.planned_end_time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      )}
                    </div>
                    {checklistEnabled && checklistItems.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          Checklist: {checklistItems.length} item{checklistItems.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => setStep(3)}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0 mt-0.5">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-5 py-5">
            <p className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              What happens when you start
            </p>
            <div className="space-y-2.5">
              {smsEnabled && checklistEnabled && checklistItems.length > 0 && (
                <>
                  <Step num="1" text={`Safety checklist SMS sent to ${form.assigned_name}`} />
                  <Step num="2" text="First check-in SMS sent after checklist is completed" />
                  <Step num="3" text={`Check-ins repeat every ${getIntervalLabel()}`} />
                </>
              )}
              {smsEnabled && !checklistEnabled && (
                <>
                  <Step num="1" text={`First check-in SMS sent immediately to ${form.assigned_name}`} />
                  <Step num="2" text={`Check-ins repeat every ${getIntervalLabel()}`} />
                </>
              )}
              {!smsEnabled && (
                <>
                  <Step num="1" text="Watch starts in manual monitoring mode (no SMS)" />
                  <Step num="2" text={`Check-ins every ${getIntervalLabel()} — share the link manually`} />
                </>
              )}
            </div>
          </div>

          <NavButtons onBack={prevStep} onNext={handleSubmit} nextLabel="Start Watch" nextColor="green" loading={loading}
            nextDisabled={facilities.length === 0 || checklistBlocking || (smsEnabled && !smsConsent)} />
        </div>
      )}
    </div>
  )
}

// Small helper for the "what happens" list
function Step({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{num}</div>
      <p className="text-sm text-blue-800 leading-snug">{text}</p>
    </div>
  )
}
