'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'

type CheckInState =
  | { phase: 'loading' }
  | { phase: 'expired'; message: string }
  | { phase: 'invalid'; message: string }
  | { phase: 'checklist_pending'; message: string }
  | { phase: 'ready'; facilityName: string; assignedName: string; scheduledTime: string; nextTime: string }
  | { phase: 'submitting' }
  | { phase: 'confirmed'; nextCheckIn: string; serverTime: string }
  | { phase: 'error'; message: string }

async function getLocation(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  })
}

function Logo() {
  return (
    <div className="flex justify-center mb-4">
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

export default function CheckInPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<CheckInState>({ phase: 'loading' })

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/checkin/validate?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 410) {
            setState({ phase: 'expired', message: data.error ?? 'This check-in window has expired.' })
          } else if (res.status === 409 && data.error === 'checklist_pending') {
            setState({ phase: 'checklist_pending', message: data.message ?? 'Complete the pre-watch safety checklist first.' })
          } else {
            setState({ phase: 'invalid', message: data.error ?? 'Invalid check-in link.' })
          }
          return
        }
        setState({
          phase: 'ready',
          facilityName: data.facilityName,
          assignedName: data.assignedName,
          scheduledTime: data.scheduledTime,
          nextTime: data.nextTime,
        })
      } catch {
        setState({ phase: 'error', message: 'Network error. Please try again.' })
      }
    }
    validate()
  }, [token])

  async function handleCheckIn() {
    setState({ phase: 'submitting' })
    const deviceTime = new Date().toISOString()
    const location = await getLocation()

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          device_time: deviceTime,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          gps_accuracy: location?.accuracy ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 410) {
          setState({ phase: 'expired', message: data.error })
        } else {
          setState({ phase: 'error', message: data.error ?? 'Check-in failed. Please try again.' })
        }
        return
      }
      setState({
        phase: 'confirmed',
        nextCheckIn: data.nextCheckIn,
        serverTime: data.serverTime,
      })
    } catch {
      setState({ phase: 'error', message: 'Network error. Please try again.' })
    }
  }

  // ===== RENDER =====

  if (state.phase === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
        <Logo />
        <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (state.phase === 'expired') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-900/50 flex items-center justify-center">
            <span className="text-red-400 text-2xl font-bold">✕</span>
          </div>
          <h1
            className="text-2xl text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Window Expired
          </h1>
          <p className="text-red-300 text-sm mb-4">{state.message}</p>
          <p className="text-slate-500 text-xs">
            This check-in window has closed. The missed check-in has been logged and your supervisor has been notified.
          </p>
        </div>
      </div>
    )
  }

  if (state.phase === 'checklist_pending') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-amber-950/30 border border-amber-700/40 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-900/40 flex items-center justify-center">
            <span className="text-amber-400 text-2xl">📋</span>
          </div>
          <h1
            className="text-2xl text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Checklist First
          </h1>
          <p className="text-amber-300 text-sm mb-2">{state.message}</p>
          <p className="text-slate-500 text-xs">
            Check your messages for the pre-watch safety checklist link and complete it before checking in.
          </p>
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
          <h1
            className="text-2xl text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
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
          <h1
            className="text-xl text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Something went wrong
          </h1>
          <p className="text-slate-400 text-sm mb-6">{state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl text-sm transition-all hover:bg-slate-100"
          >
            Try Again
          </button>
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
          <h1
            className="text-2xl text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Check-In Confirmed
          </h1>
          <p className="text-green-300 text-sm mb-6">
            Your check-in has been recorded and timestamped.
          </p>
          <div className="bg-green-900/30 rounded-xl px-6 py-4 mb-5">
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1">Next Check-In Due</p>
            <p className="text-white text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {format(new Date(state.nextCheckIn), 'h:mm a')}
            </p>
            <p className="text-green-400 text-xs mt-1">
              {format(new Date(state.nextCheckIn), 'EEEE, MMM d')}
            </p>
          </div>
          <p className="text-slate-500 text-xs">
            You will receive an SMS with a new link when that window opens.
          </p>
        </div>
      </div>
    )
  }

  if (state.phase === 'submitting') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-10 h-10 mx-auto mb-4 border-3 border-slate-700 border-t-green-500 rounded-full animate-spin" />
          <h1
            className="text-xl text-white mb-1"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Recording check-in…
          </h1>
          <p className="text-slate-500 text-xs">Recording your check-in. Do not close.</p>
        </div>
      </div>
    )
  }

  // phase === 'ready'
  const { facilityName, assignedName, scheduledTime } = state

  return (
    <CheckInReady
      facilityName={facilityName}
      assignedName={assignedName}
      scheduledTime={scheduledTime}
      onCheckIn={handleCheckIn}
    />
  )
}

function CheckInReady({
  facilityName,
  assignedName,
  scheduledTime,
  onCheckIn,
}: {
  facilityName: string
  assignedName: string
  scheduledTime: string
  onCheckIn: () => void
}) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const diffSec = Math.floor((now.getTime() - new Date(scheduledTime).getTime()) / 1000)
  const diffMin = Math.floor(Math.abs(diffSec) / 60)
  const timeContext =
    diffSec < -60 ? `Due in ${diffMin + 1} min` :
    diffSec <= 60  ? 'Due now' :
    diffMin === 1  ? 'Overdue by 1 min' :
                     `Overdue by ${diffMin} min`
  const contextColor =
    diffSec > 60 ? 'text-red-400' :
    diffSec > 0  ? 'text-amber-400' :
                   'text-green-400'

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Logo />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-4">
          {/* Info header */}
          <div className="px-6 py-5 border-b border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Fire Watch Check-In</p>
            <h1
              className="text-white text-xl mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              {facilityName}
            </h1>
            <p className="text-slate-400 text-sm">{assignedName}</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-slate-500 text-sm">
                Due: <span className="text-white font-bold">{format(new Date(scheduledTime), 'h:mm a')}</span>
              </p>
              <span className={`text-xs font-bold ${contextColor}`}>{timeContext}</span>
            </div>
          </div>

          {/* The big button */}
          <div className="p-6">
            <button
              onClick={onCheckIn}
              className="w-full py-8 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white text-2xl font-black rounded-2xl shadow-2xl shadow-green-900/50 transition-all select-none touch-manipulation active:scale-[0.97]"
            >
              CHECK IN NOW
            </button>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center max-w-xs mx-auto leading-relaxed">
          Tap the button to record your check-in. GPS is captured if your browser allows it — if not, your check-in still records without location.
          You will receive an SMS for your next window.
        </p>
      </div>
    </div>
  )
}
