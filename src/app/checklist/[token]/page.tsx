'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

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
          <p className="text-green-300 text-sm mb-5">
            All safety items have been logged and timestamped.
          </p>
          <p className="text-slate-500 text-xs">
            You will receive an SMS with your first check-in link at the scheduled time.
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
        <div className="space-y-2 mb-4">
          {items.map((item) => {
            const comp = completions[item.id]
            const isChecked = comp?.checked ?? false
            const isUploading = comp?.uploading ?? false
            const hasPhoto = !!comp?.photo_url

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-all ${
                  isChecked ? 'border-green-800/60' :
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
                      className={`mt-0.5 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                        isChecked
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-slate-600 text-transparent'
                      }`}
                    >
                      <span className="text-xs font-bold">✓</span>
                    </button>
                  ) : (
                    <div
                      role="checkbox"
                      aria-checked={hasPhoto}
                      aria-label={`${item.label} (photo required)`}
                      className={`mt-0.5 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        hasPhoto ? 'border-green-500 bg-green-500 text-white' : 'border-slate-600 text-slate-500'
                      }`}
                    >
                      <span className="text-xs">{hasPhoto ? '✓' : '📷'}</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isChecked ? 'text-green-300' : 'text-white'}`}>
                      {item.label}
                    </p>
                    {item.requires_photo && (
                      <div className="mt-2">
                        {hasPhoto ? (
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={comp.photo_url!}
                              alt={`Photo for: ${item.label}`}
                              className="w-16 h-16 object-cover rounded-lg border border-green-800/40"
                            />
                            <button
                              onClick={() => {
                                setCompletions((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], photo_url: null, checked: false },
                                }))
                              }}
                              className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            >
                              Retake
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRefs.current[item.id]?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 font-medium transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                          >
                            {isUploading ? (
                              <>
                                <span className="w-3 h-3 border border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                                Uploading…
                              </>
                            ) : (
                              <>
                                <span>📷</span>
                                Take Photo
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
          disabled={!allChecked}
          className={`w-full py-5 text-white text-lg font-black rounded-2xl shadow-xl transition-all select-none touch-manipulation active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
            allChecked
              ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-900/40'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
          }`}
        >
          {allChecked ? 'SUBMIT CHECKLIST' : `${items.length - completedCount} ITEM${items.length - completedCount !== 1 ? 'S' : ''} REMAINING`}
        </button>

        <p className="text-slate-600 text-xs text-center mt-4 leading-relaxed">
          All items are logged with server-side timestamps. Photos are stored securely.
        </p>
      </div>
    </div>
  )
}
