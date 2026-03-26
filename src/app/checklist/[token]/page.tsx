'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import BrandLogo from '@/components/BrandLogo'

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface ChecklistItem {
  id: string
  label: string
  requires_photo: boolean
  sort_order: number
}

type GpsStatus = 'unchecked' | 'checking' | 'granted' | 'denied' | 'unavailable'

type ChecklistState =
  | { phase: 'loading' }
  | { phase: 'invalid'; message: string }
  | { phase: 'already_done'; message: string }
  | { phase: 'ready'; watchId: string; facilityName: string; assignedName: string; items: ChecklistItem[] }
  | { phase: 'submitting' }
  | { phase: 'confirmed'; completedAt: string }
  | { phase: 'error'; message: string }

interface ItemCompletion {
  item_id: string
  checked: boolean
  photo_url: string | null
  localPreview: string | null  // object URL for immediate display
  uploadFailed: boolean
  uploading: boolean
}

// ═══════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════

const CameraIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const CheckIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const LocationIcon = ({ color = '#4ade80' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

// ═══════════════════════════════════════════════════
// STEP INDICATOR (dark theme)
// ═══════════════════════════════════════════════════

function StepIndicator({ current, total, labels, icons }: {
  current: number; total: number; labels: string[]; icons: React.ReactNode[]
}) {
  return (
    <div className="mt-5">
      <div className="h-1 bg-slate-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between">
        {labels.map((label, i) => {
          const stepNum = i + 1
          const isDone = stepNum < current
          const isActive = stepNum === current
          return (
            <div key={label} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / total}%` }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDone ? 'bg-green-500 text-white' :
                isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' :
                'bg-slate-800 text-slate-600'
              }`}>
                {isDone ? <CheckIcon size={14} /> : icons[i]}
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wide transition-colors ${
                isDone ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-slate-600'
              }`}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const stepIcons = [
  <CameraIcon key="cam" size={14} />,
  <svg key="clip" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>,
  <svg key="shield" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
]

// ═══════════════════════════════════════════════════
// LOGO
// ═══════════════════════════════════════════════════

function Logo() {
  return (
    <div className="flex justify-center mb-4">
      <BrandLogo variant="light" className="h-10 w-auto" />
    </div>
  )
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function ChecklistPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<ChecklistState>({ phase: 'loading' })
  const [completions, setCompletions] = useState<Record<string, ItemCompletion>>({})
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('unchecked')
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const submittingRef = useRef(false)
  const pendingBlobs = useRef<Record<string, Blob>>({})

  // Multi-step state
  const [step, setStep] = useState(1)
  const [photoSlideIndex, setPhotoSlideIndex] = useState(0)
  const [slideDir, setSlideDir] = useState<'forward' | 'back'>('forward')
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Validate token on mount ──
  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/checklist/validate?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 410 || res.status === 409) {
            setState({ phase: 'already_done', message: data.error ?? 'Checklist already completed.' })
          } else {
            setState({ phase: 'invalid', message: data.error ?? 'Invalid checklist link.' })
          }
          return
        }
        const initial: Record<string, ItemCompletion> = {}
        for (const item of data.items) {
          initial[item.id] = { item_id: item.id, checked: false, photo_url: null, localPreview: null, uploadFailed: false, uploading: false }
        }
        setCompletions(initial)

        const hasPhotos = data.items.some((i: ChecklistItem) => i.requires_photo)
        if (!hasPhotos) setStep(2) // skip photo step

        setState({
          phase: 'ready',
          watchId: data.watchId,
          facilityName: data.facilityName,
          assignedName: data.assignedName,
          items: data.items,
        })
      } catch {
        setState({ phase: 'error', message: 'Network error. Please try again.' })
      }
    }
    validate()
  }, [token])

  // ── GPS check when entering step 3 ──
  useEffect(() => {
    if (step === 3 && gpsStatus === 'unchecked') {
      checkGpsPermission()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // ── Cleanup auto-advance timer ──
  useEffect(() => {
    return () => { if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current) }
  }, [])

  // ── Derived values ──
  const items = state.phase === 'ready' ? state.items : []
  const photoItems = items.filter(i => i.requires_photo)
  const safetyItems = items.filter(i => !i.requires_photo)
  const hasPhotoStep = photoItems.length > 0
  const allPhotosDone = photoItems.every(i => completions[i.id]?.checked)
  const allSafetyDone = safetyItems.every(i => completions[i.id]?.checked)
  const allChecked = (photoItems.length === 0 || allPhotosDone) && (safetyItems.length === 0 || allSafetyDone)
  const completedCount = items.filter(i => completions[i.id]?.checked).length
  const anyUploading = Object.values(completions).some(c => c.uploading)

  // ── Navigation ──
  function nextStep() {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    setSlideDir('forward')
    setStep(s => Math.min(s + 1, 3))
  }

  function prevStep() {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    setSlideDir('back')
    setStep(s => Math.max(s - 1, hasPhotoStep ? 1 : 2))
  }

  function nextPhotoSlide() {
    setSlideDir('forward')
    if (photoSlideIndex < photoItems.length - 1) {
      setPhotoSlideIndex(i => i + 1)
    }
  }

  function prevPhotoSlide() {
    setSlideDir('back')
    if (photoSlideIndex > 0) {
      setPhotoSlideIndex(i => i - 1)
    }
  }

  // ── Toggle safety item ──
  function toggleItem(id: string) {
    setCompletions(prev => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked },
    }))
  }

  // ── Photo capture with local blob retention ──
  const handlePhotoCapture = useCallback(async (item: ChecklistItem, file: File) => {
    if (state.phase !== 'ready') return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Only image files are allowed.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Photo must be under 10 MB.')
      return
    }

    // Prevent concurrent upload for same item
    if (completions[item.id]?.uploading) return

    // Store blob locally so we never lose it
    pendingBlobs.current[item.id] = file

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setCompletions(prev => ({
      ...prev,
      [item.id]: { ...prev[item.id], uploading: true, localPreview: localUrl, uploadFailed: false },
    }))
    setPhotoError(null)

    await uploadPhoto(item.id, file, localUrl)
  }, [state.phase, completions]) // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadPhoto(itemId: string, file: Blob, localUrl: string) {
    if (state.phase !== 'ready') return
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('watch_id', state.watchId)
      fd.append('item_id', itemId)
      fd.append('checklist_token', token)
      const res = await fetch('/api/checklist/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Upload succeeded — store the real URL
      setCompletions(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], uploading: false, photo_url: data.photo_url, checked: true, uploadFailed: false },
      }))
      // Clean up blob
      delete pendingBlobs.current[itemId]

      // Auto-advance to next photo slide
      const photoIdx = photoItems.findIndex(p => p.id === itemId)
      if (photoIdx >= 0 && photoIdx < photoItems.length - 1) {
        autoAdvanceTimer.current = setTimeout(() => {
          setSlideDir('forward')
          setPhotoSlideIndex(photoIdx + 1)
        }, 500)
      } else if (photoIdx === photoItems.length - 1) {
        // Last photo done — check if all photos done, auto-advance to step 2
        const willAllBeDone = photoItems.every((p, i) =>
          i === photoIdx ? true : completions[p.id]?.checked
        )
        if (willAllBeDone) {
          autoAdvanceTimer.current = setTimeout(() => nextStep(), 600)
        }
      }
    } catch {
      setCompletions(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], uploading: false, uploadFailed: true },
      }))
      setPhotoError('Upload failed. Tap "Retry" to try again.')
    }
  }

  function retryUpload(itemId: string) {
    const blob = pendingBlobs.current[itemId]
    const localUrl = completions[itemId]?.localPreview
    if (!blob || !localUrl) return
    setCompletions(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], uploading: true, uploadFailed: false },
    }))
    setPhotoError(null)
    uploadPhoto(itemId, blob, localUrl)
  }

  function retakePhoto(itemId: string) {
    // Clean up old preview
    const old = completions[itemId]?.localPreview
    if (old) URL.revokeObjectURL(old)
    delete pendingBlobs.current[itemId]
    setCompletions(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], photo_url: null, localPreview: null, checked: false, uploadFailed: false, uploading: false },
    }))
  }

  // ── GPS ──
  async function checkGpsPermission(): Promise<GpsStatus> {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable')
      return 'unavailable'
    }
    setGpsStatus('checking')
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        () => { setGpsStatus('granted'); resolve('granted') },
        (err) => {
          const status = err.code === err.PERMISSION_DENIED ? 'denied' : 'granted'
          setGpsStatus(status)
          resolve(status)
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      )
    })
  }

  // ── Submit ──
  async function handleSubmit() {
    if (state.phase !== 'ready' || submittingRef.current) return
    if (anyUploading) return
    if (!allChecked) return

    if (gpsStatus !== 'granted' && gpsStatus !== 'unavailable') {
      const result = await checkGpsPermission()
      if (result === 'denied') return
    }

    submittingRef.current = true
    setState({ phase: 'submitting' })
    try {
      const payload = Object.values(completions).map(c => ({
        item_id: c.item_id,
        photo_url: c.photo_url ?? null,
      }))
      const res = await fetch('/api/checklist/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, completions: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState({ phase: 'confirmed', completedAt: data.completedAt })
    } catch (err) {
      submittingRef.current = false
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Submission failed.' })
    }
  }

  // ═══════════════════════════════════════════════════
  // RENDER — Non-ready phases (unchanged)
  // ═══════════════════════════════════════════════════

  if (state.phase === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
        <Logo />
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (state.phase === 'already_done') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-900/50 border-2 border-green-500 flex items-center justify-center">
            <span className="text-green-400 text-2xl font-bold">&#10003;</span>
          </div>
          <h1 className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Already Completed</h1>
          <p className="text-green-300 text-sm">{state.message}</p>
        </div>
      </div>
    )
  }

  if (state.phase === 'invalid') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-slate-400 text-2xl font-bold">?</span>
          </div>
          <h1 className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Invalid Link</h1>
          <p className="text-slate-400 text-sm">{state.message}</p>
        </div>
      </div>
    )
  }

  if (state.phase === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-900/30 flex items-center justify-center">
            <span className="text-amber-400 text-2xl font-bold">!</span>
          </div>
          <h1 className="text-xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Something went wrong</h1>
          <p className="text-slate-400 text-sm mb-6">{state.message}</p>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl text-sm transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (state.phase === 'submitting') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center" role="status" aria-label="Submitting checklist">
        <Logo />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" aria-hidden="true" />
          <h1 className="text-xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Submitting checklist...</h1>
          <p className="text-slate-500 text-xs">Logging all items. Do not close.</p>
        </div>
      </div>
    )
  }

  if (state.phase === 'confirmed') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-900/50 border-2 border-green-500 flex items-center justify-center">
            <span className="text-green-400 text-3xl font-bold">&#10003;</span>
          </div>
          <h1 className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Checklist Complete</h1>
          <p className="text-green-300 text-sm mb-6">All safety items verified and logged.</p>
          <div className="bg-green-900/30 rounded-xl px-6 py-4 mb-5">
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1">Completed At</p>
            <p className="text-white text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{format(new Date(state.completedAt), 'h:mm:ss a')}</p>
            <p className="text-green-400 text-xs mt-1">{format(new Date(state.completedAt), 'EEEE, MMM d, yyyy')}</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl px-5 py-4 mb-5 border border-slate-800/60">
            <div className="flex items-center gap-2 justify-center mb-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">What Happens Next</p>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">You will receive your first check-in link when the window opens. Tap it to confirm you are on-site.</p>
          </div>
          <p className="text-slate-600 text-xs">This checklist has been logged in the compliance report.</p>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // RENDER — Ready phase (multi-step wizard)
  // ═══════════════════════════════════════════════════

  if (state.phase !== 'ready') return null
  const { facilityName, assignedName } = state
  const totalPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  // Current photo item
  const currentPhotoItem = photoItems[photoSlideIndex]
  const currentPhotoComp = currentPhotoItem ? completions[currentPhotoItem.id] : null
  const photosDoneCount = photoItems.filter(i => completions[i.id]?.checked).length
  const safetyDoneCount = safetyItems.filter(i => completions[i.id]?.checked).length

  // Slide animation class
  const slideClass = slideDir === 'forward'
    ? 'animate-[slideInRight_0.25s_ease-out]'
    : 'animate-[slideInLeft_0.25s_ease-out]'

  // Next button config
  let nextLabel = ''
  let nextDisabled = false
  let nextAction = nextStep
  let isSubmitButton = false

  if (step === 1) {
    if (currentPhotoComp?.checked && photoSlideIndex < photoItems.length - 1) {
      nextLabel = 'Next Photo'
      nextAction = nextPhotoSlide
    } else if (allPhotosDone) {
      nextLabel = 'Continue to Safety Check'
      nextAction = nextStep
    } else {
      nextLabel = `Photo ${photoSlideIndex + 1} of ${photoItems.length}`
      nextDisabled = true
    }
  } else if (step === 2) {
    if (allSafetyDone) {
      nextLabel = 'Review & Submit'
    } else {
      nextLabel = `${safetyDoneCount} of ${safetyItems.length} verified`
      nextDisabled = true
    }
  } else {
    nextLabel = 'COMPLETE CHECKLIST'
    nextDisabled = !allChecked || anyUploading || gpsStatus === 'denied'
    nextAction = handleSubmit
    isSubmitButton = true
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <style>{`
        @keyframes checkPop {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .check-pop { animation: checkPop 0.25s ease-out; }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
        <div className="max-w-sm mx-auto px-5 pt-5 pb-4">
          <Logo />
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-amber-900/40 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-white text-base leading-tight truncate" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>{facilityName}</h1>
              <p className="text-slate-500 text-xs truncate">{assignedName}</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <span className={`text-xs font-bold ${totalPct === 100 ? 'text-green-400' : 'text-slate-500'}`}>{totalPct}%</span>
            </div>
          </div>
          <StepIndicator
            current={step}
            total={3}
            labels={hasPhotoStep ? ['Photos', 'Verify', 'Submit'] : ['—', 'Verify', 'Submit']}
            icons={stepIcons}
          />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-32">
        <div className="max-w-sm mx-auto">

          {/* ════════ STEP 1: Photo Documentation ════════ */}
          {step === 1 && currentPhotoItem && currentPhotoComp && (
            <div key={`photo-${photoSlideIndex}`} className={slideClass}>
              {/* Sub-progress */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">
                  Photo {photoSlideIndex + 1} of {photoItems.length}
                </p>
                <div className="flex gap-1.5">
                  {photoItems.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                      i < photoSlideIndex ? 'bg-green-500' :
                      i === photoSlideIndex ? 'bg-blue-500' :
                      'bg-slate-700'
                    }`} />
                  ))}
                </div>
              </div>

              {/* Photo card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 pt-5 pb-3">
                  <p className="text-white text-sm font-semibold leading-snug">{currentPhotoItem.label}</p>
                </div>

                <div className="px-5 pb-5">
                  {/* Has photo (uploaded or local preview) */}
                  {(currentPhotoComp.photo_url || currentPhotoComp.localPreview) ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden border-2 border-green-700/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentPhotoComp.photo_url || currentPhotoComp.localPreview!}
                          alt={`Photo: ${currentPhotoItem.label}`}
                          className="w-full h-40 sm:h-48 object-cover"
                        />
                        {currentPhotoComp.uploading && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                            <p className="text-white text-xs font-semibold">Uploading...</p>
                          </div>
                        )}
                        {currentPhotoComp.uploadFailed && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 px-4">
                            <div className="w-10 h-10 rounded-full bg-red-900/60 flex items-center justify-center">
                              <span className="text-red-400 text-xl font-bold">!</span>
                            </div>
                            <p className="text-red-300 text-xs font-semibold text-center">Upload failed. Your photo is saved locally.</p>
                            <button
                              onClick={() => retryUpload(currentPhotoItem.id)}
                              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.97]"
                            >
                              Retry Upload
                            </button>
                          </div>
                        )}
                        {currentPhotoComp.checked && !currentPhotoComp.uploading && !currentPhotoComp.uploadFailed && (
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg check-pop">
                            <CheckIcon size={16} />
                          </div>
                        )}
                      </div>
                      {currentPhotoComp.checked && !currentPhotoComp.uploading && (
                        <button
                          onClick={() => { retakePhoto(currentPhotoItem.id); fileInputRefs.current[currentPhotoItem.id]?.click() }}
                          className="w-full py-2.5 text-xs text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800/50 rounded-xl transition-all"
                        >
                          Retake Photo
                        </button>
                      )}
                    </div>
                  ) : (
                    /* No photo yet — camera button */
                    <button
                      onClick={() => fileInputRefs.current[currentPhotoItem.id]?.click()}
                      className="w-full flex flex-col items-center justify-center gap-3 py-12 bg-slate-800 hover:bg-slate-750 border-2 border-dashed border-slate-600 hover:border-blue-600/50 rounded-xl text-slate-300 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-600/20 border-2 border-blue-600/40 flex items-center justify-center">
                        <CameraIcon size={24} className="text-blue-400" />
                      </div>
                      <span className="text-sm font-bold">Tap to Take Photo</span>
                      <span className="text-[11px] text-slate-500">Use your camera to document this item</span>
                    </button>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={el => { fileInputRefs.current[currentPhotoItem.id] = el }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoCapture(currentPhotoItem, file)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>

              {/* Photo error */}
              {photoError && (
                <div className="mt-3 flex items-start gap-3 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3">
                  <span className="text-red-400 font-bold flex-shrink-0">!</span>
                  <p className="text-red-300 text-xs leading-relaxed">{photoError}</p>
                  <button onClick={() => setPhotoError(null)} className="ml-auto text-red-600 hover:text-red-400 text-lg leading-none flex-shrink-0">&times;</button>
                </div>
              )}

              {/* Already completed photos summary */}
              {photosDoneCount > 0 && (
                <div className="mt-4 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-2">Completed Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {photoItems.map((p, i) => {
                      const comp = completions[p.id]
                      if (!comp?.checked) return null
                      return (
                        <button
                          key={p.id}
                          onClick={() => { setSlideDir(i < photoSlideIndex ? 'back' : 'forward'); setPhotoSlideIndex(i) }}
                          className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                            i === photoSlideIndex ? 'border-blue-500' : 'border-green-700/40'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={comp.photo_url || comp.localPreview!} alt="" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 flex items-center justify-center">
                            <CheckIcon size={8} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════ STEP 2: Safety Verification ════════ */}
          {step === 2 && (
            <div key="safety" className={slideClass}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Safety Verification</p>
                <span className={`text-xs font-bold ${allSafetyDone ? 'text-green-400' : 'text-slate-500'}`}>
                  {safetyDoneCount}/{safetyItems.length}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
                {safetyItems.map((item, index) => {
                  const comp = completions[item.id]
                  const isChecked = comp?.checked ?? false
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`w-full flex items-start gap-3.5 px-4 py-3.5 text-left transition-all duration-200 active:bg-slate-800/60 ${
                        isChecked ? 'bg-green-950/20' : ''
                      }`}
                    >
                      <div className={`mt-0.5 w-9 h-9 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isChecked
                          ? 'border-green-500 bg-green-500 text-white shadow-md shadow-green-900/50 check-pop'
                          : 'border-slate-600 text-transparent'
                      }`}>
                        <CheckIcon size={14} />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isChecked ? 'text-green-500' : 'text-slate-600'}`}>
                          {isChecked ? 'Verified' : `${index + 1} of ${safetyItems.length}`}
                        </span>
                        <p className={`text-[13px] font-medium leading-snug mt-0.5 transition-colors ${isChecked ? 'text-green-300' : 'text-white'}`}>
                          {item.label}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {allSafetyDone && (
                <div className="mt-4 flex items-center gap-3 bg-green-950/30 border border-green-800/40 rounded-xl px-4 py-3">
                  <CheckIcon size={16} />
                  <p className="text-green-400 text-xs font-semibold">All safety items verified</p>
                </div>
              )}
            </div>
          )}

          {/* ════════ STEP 3: Confirm & Submit ════════ */}
          {step === 3 && (
            <div key="confirm" className={slideClass}>
              <div className="mb-5">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Review & Submit</p>
                <p className="text-slate-400 text-xs">Confirm all items are correct, then submit.</p>
              </div>

              {/* GPS Status */}
              {gpsStatus === 'checking' && (
                <div className="mb-4 flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                  <span className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
                  <p className="text-slate-300 text-xs">Checking location services...</p>
                </div>
              )}
              {gpsStatus === 'granted' && (
                <div className="mb-4 flex items-center gap-3 bg-green-950/40 border border-green-800/50 rounded-xl px-4 py-3">
                  <LocationIcon />
                  <p className="text-green-400 text-xs font-semibold">Location services enabled</p>
                </div>
              )}
              {gpsStatus === 'denied' && (
                <div className="mb-4 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-3">
                    <LocationIcon color="#f87171" />
                    <div>
                      <p className="text-red-300 text-xs font-semibold mb-1">Location services blocked</p>
                      <p className="text-red-400/80 text-[11px] leading-relaxed">GPS is required for compliance. Open browser settings and allow location access, then tap below.</p>
                    </div>
                  </div>
                  <button onClick={() => checkGpsPermission()} className="mt-3 w-full py-2.5 bg-red-900/60 hover:bg-red-900/80 border border-red-700/50 text-red-300 text-xs font-semibold rounded-lg transition-all">
                    Try Again
                  </button>
                </div>
              )}
              {gpsStatus === 'unavailable' && (
                <div className="mb-4 flex items-start gap-3 bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3">
                  <span className="text-amber-400 font-bold flex-shrink-0">!</span>
                  <p className="text-amber-300 text-[11px] leading-relaxed">GPS is not available on this device. Check-ins will be logged without location data.</p>
                </div>
              )}

              {/* Summary card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Photo items summary */}
                {photoItems.length > 0 && (
                  <div className="px-4 pt-4 pb-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Photo Documentation</p>
                    <div className="flex gap-2 flex-wrap">
                      {photoItems.map(item => {
                        const comp = completions[item.id]
                        return (
                          <div key={item.id} className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-green-700/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={comp?.photo_url || comp?.localPreview || ''} alt="" className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 flex items-center justify-center">
                              <CheckIcon size={8} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Safety items summary */}
                <div className={`px-4 pb-4 ${photoItems.length > 0 ? 'pt-3 border-t border-slate-800/60' : 'pt-4'}`}>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Safety Items</p>
                  <div className="space-y-1.5">
                    {safetyItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckIcon size={10} />
                        </div>
                        <p className="text-slate-300 text-xs leading-snug">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total count */}
                <div className="border-t border-slate-800 px-4 py-3 bg-slate-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-semibold">{completedCount} of {items.length} items verified</span>
                    <span className={`text-xs font-bold ${allChecked ? 'text-green-400' : 'text-amber-400'}`}>{totalPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed bottom nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800/50 z-20">
        <div className="max-w-sm mx-auto px-5 py-4 flex gap-3">
          {/* Back button */}
          {((step === 1 && photoSlideIndex > 0) || step > (hasPhotoStep ? 1 : 2)) && (
            <button
              onClick={step === 1 ? prevPhotoSlide : prevStep}
              className="px-5 py-4 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 font-bold rounded-2xl transition-all active:scale-[0.97] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Back
            </button>
          )}

          {/* Next / Submit button */}
          <button
            onClick={nextAction}
            disabled={nextDisabled}
            className={`flex-1 py-4 font-bold rounded-2xl shadow-xl transition-all duration-200 select-none touch-manipulation active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 text-sm ${
              nextDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                : isSubmitButton
                  ? 'bg-green-600 hover:bg-green-500 active:bg-green-700 text-white shadow-green-900/40 focus-visible:ring-green-300'
                  : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-900/40 focus-visible:ring-blue-300'
            }`}
          >
            {nextLabel}
          </button>
        </div>

        {/* Safe area padding for notched phones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}
