'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'

interface ChecklistItem {
  id: string
  label: string
  requires_photo: boolean
  sort_order: number
}

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
  uploading: boolean
}

function Logo() {
  return (
    <div className="flex justify-center mb-6">
      <Image
        src="/logo.svg"
        alt="DutyProof"
        width={160}
        height={48}
        className="h-10 w-auto object-contain"
        priority
      />
    </div>
  )
}

export default function ChecklistPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<ChecklistState>({ phase: 'loading' })
  const [completions, setCompletions] = useState<Record<string, ItemCompletion>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const submittingRef = useRef(false)

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
          initial[item.id] = { item_id: item.id, checked: false, photo_url: null, uploading: false }
        }
        setCompletions(initial)
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

  function toggleItem(id: string) {
    setCompletions((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked },
    }))
  }

  async function handlePhotoCapture(item: ChecklistItem, file: File) {
    if (state.phase !== 'ready') return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Only image files are allowed.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Photo must be smaller than 10 MB.')
      return
    }
    setCompletions((prev) => ({ ...prev, [item.id]: { ...prev[item.id], uploading: true } }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('watch_id', state.watchId)
      fd.append('item_id', item.id)
      fd.append('checklist_token', token)
      const res = await fetch('/api/checklist/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPhotoError(null)
      setCompletions((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], uploading: false, photo_url: data.photo_url, checked: true },
      }))
    } catch {
      setCompletions((prev) => ({ ...prev, [item.id]: { ...prev[item.id], uploading: false } }))
      setPhotoError('Photo upload failed. Please try again.')
    }
  }

  async function handleSubmit() {
    if (state.phase !== 'ready' || submittingRef.current) return

    const anyUploading = Object.values(completions).some((c) => c.uploading)
    if (anyUploading) return

    const allChecked = state.items.every((item) => completions[item.id]?.checked)
    if (!allChecked) {
      setSubmitAttempted(true)
      return
    }
    setSubmitAttempted(false)
    submittingRef.current = true

    setState({ phase: 'submitting' })
    try {
      const payload = Object.values(completions).map((c) => ({
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
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Submission failed.' })
    }
  }

  // ===== RENDER =====

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
            <span className="text-green-400 text-2xl font-bold">✓</span>
          </div>
          <h1 className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Already Completed
          </h1>
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
          <h1 className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Invalid Link
          </h1>
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
          <h1 className="text-xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Something went wrong
          </h1>
          <p className="text-slate-400 text-sm mb-6">{state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl text-sm transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
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
          <h1 className="text-xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Submitting checklist…
          </h1>
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
            <span className="text-green-400 text-3xl font-bold">✓</span>
          </div>
          <h1 className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Checklist Complete
          </h1>
          <p className="text-green-300 text-sm mb-6">
            All safety items verified and logged.
          </p>
          <div className="bg-green-900/30 rounded-xl px-6 py-4 mb-5">
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1">Completed At</p>
            <p className="text-white text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {format(new Date(state.completedAt), 'h:mm:ss a')}
            </p>
            <p className="text-green-400 text-xs mt-1">
              {format(new Date(state.completedAt), 'EEEE, MMM d, yyyy')}
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-xl px-5 py-4 mb-5 border border-slate-800/60">
            <div className="flex items-center gap-2 justify-center mb-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">What Happens Next</p>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              You will receive your first check-in link when the window opens. Tap it to confirm you are on-site.
            </p>
          </div>
          <p className="text-slate-600 text-xs">
            This checklist has been logged in the compliance report.
          </p>
        </div>
      </div>
    )
  }

  // phase === 'ready'
  if (state.phase !== 'ready') return null
  const { facilityName, assignedName, items } = state
  const allChecked = items.every((item) => completions[item.id]?.checked)
  const completedCount = items.filter((item) => completions[item.id]?.checked).length
  const anyUploading = Object.values(completions).some((c) => c.uploading)

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-8">
      <div className="w-full max-w-sm mx-auto">
        <Logo />

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Pre-Watch Safety Checklist</p>
          <h1 className="text-white text-lg mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            {facilityName}
          </h1>
          <p className="text-slate-400 text-sm">{assignedName}</p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{completedCount} of {items.length} complete</span>
              <span>{Math.round((completedCount / items.length) * 100)}%</span>
            </div>
            <div
              className="h-1.5 bg-slate-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={items.length}
              aria-label={`${completedCount} of ${items.length} items complete`}
            >
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / items.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist items */}
        <div className="space-y-2.5 mb-4">
          {items.map((item, index) => {
            const comp = completions[item.id]
            const isChecked = comp?.checked ?? false
            const isUploading = comp?.uploading ?? false
            const hasPhoto = !!comp?.photo_url

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-all ${
                  isChecked ? 'border-green-800/60 bg-green-950/20' :
                  submitAttempted ? 'border-red-700/60 bg-red-950/20' :
                  'border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox / status */}
                  {!item.requires_photo ? (
                    <button
                      onClick={() => toggleItem(item.id)}
                      role="checkbox"
                      aria-checked={isChecked}
                      aria-label={item.label}
                      className={`mt-0.5 w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                        isChecked
                          ? 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-900/40'
                          : 'border-slate-600 text-transparent'
                      }`}
                    >
                      <span className="text-sm font-bold">✓</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => !hasPhoto && fileInputRefs.current[item.id]?.click()}
                      role="checkbox"
                      aria-checked={hasPhoto}
                      aria-label={`${item.label} (photo required)`}
                      className={`mt-0.5 w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                        hasPhoto
                          ? 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-900/40'
                          : 'border-slate-600 text-slate-500'
                      }`}
                    >
                      <span className="text-sm">{hasPhoto ? '✓' : '📷'}</span>
                    </button>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{index + 1} / {items.length}</span>
                      {item.requires_photo && !hasPhoto && (
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider bg-blue-950/40 border border-blue-800/30 px-1.5 py-0.5 rounded">Photo</span>
                      )}
                    </div>
                    <p className={`text-sm font-semibold leading-snug ${isChecked ? 'text-green-300' : 'text-white'}`}>
                      {item.label}
                    </p>
                    {item.requires_photo && (
                      <div className="mt-3">
                        {hasPhoto ? (
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={comp.photo_url!}
                              alt={`Photo for: ${item.label}`}
                              className="w-20 h-20 object-cover rounded-xl border-2 border-green-700/40 shadow-lg shadow-black/30"
                            />
                            <div>
                              <p className="text-[10px] text-green-400 font-bold mb-1.5">Photo captured</p>
                              <button
                                onClick={() => {
                                  setCompletions((prev) => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], photo_url: null, checked: false },
                                  }))
                                }}
                                className="text-xs text-slate-500 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-800/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                              >
                                Retake
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRefs.current[item.id]?.click()}
                            disabled={isUploading}
                            className="w-full flex items-center justify-center gap-2.5 px-4 py-4 bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-600 hover:border-blue-600/50 rounded-xl text-sm text-slate-300 font-semibold transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                          >
                            {isUploading ? (
                              <>
                                <span className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                                Uploading…
                              </>
                            ) : (
                              <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" aria-hidden="true">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                  <circle cx="12" cy="13" r="4" />
                                </svg>
                                Tap to Take Photo
                              </>
                            )}
                          </button>
                        )}
                        <input
                          ref={(el) => { fileInputRefs.current[item.id] = el }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handlePhotoCapture(item, file)
                            e.target.value = ''
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Inline error banners */}
        {photoError && (
          <div className="mb-3 flex items-start gap-3 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3">
            <span className="text-red-400 font-bold flex-shrink-0">!</span>
            <p className="text-red-300 text-xs leading-relaxed">{photoError}</p>
            <button onClick={() => setPhotoError(null)} className="ml-auto text-red-600 hover:text-red-400 text-lg leading-none flex-shrink-0">×</button>
          </div>
        )}
        {submitAttempted && !allChecked && (
          <div className="mb-3 flex items-start gap-3 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3">
            <span className="text-red-400 font-bold flex-shrink-0">!</span>
            <p className="text-red-300 text-xs leading-relaxed">
              Complete all items highlighted above before submitting.
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!allChecked || anyUploading}
          className={`w-full py-5 text-white text-lg font-black rounded-2xl shadow-xl transition-all select-none touch-manipulation active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
            allChecked && !anyUploading
              ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-900/40'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
          }`}
        >
          {anyUploading ? 'UPLOADING PHOTO…' : allChecked ? 'SUBMIT CHECKLIST' : `${items.length - completedCount} ITEM${items.length - completedCount !== 1 ? 'S' : ''} REMAINING`}
        </button>

        <p className="text-slate-600 text-xs text-center mt-4 leading-relaxed">
          All items are logged with server-side timestamps. Photos are stored securely.
        </p>
      </div>
    </div>
  )
}
