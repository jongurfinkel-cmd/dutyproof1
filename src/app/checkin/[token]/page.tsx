'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import { format } from 'date-fns'
import { queueCheckin, syncPendingCheckins } from '@/lib/offline-queue'

type CheckInState =
  | { phase: 'loading' }
  | { phase: 'expired'; message: string }
  | { phase: 'invalid'; message: string }
  | { phase: 'checklist_pending'; message: string }
  | { phase: 'ready'; facilityName: string; assignedName: string; scheduledTime: string; nextTime: string }
  | { phase: 'submitting' }
  | { phase: 'confirmed'; nextCheckIn: string; serverTime: string; gpsCapture: boolean; facilityName: string; assignedName: string; nextToken?: string }
  | { phase: 'queued'; deviceTime: string; gpsCapture: boolean }
  | { phase: 'watching'; facilityName: string; assignedName: string; nextCheckInTime: string; lastCheckInTime: string; nextToken?: string }
  | { phase: 'due'; facilityName: string; assignedName: string; scheduledTime: string; nextToken?: string }
  | { phase: 'grace'; facilityName: string; assignedName: string; scheduledTime: string; nextToken?: string }
  | { phase: 'missed_waiting'; facilityName: string; assignedName: string }
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

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.value = 0.3
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

function playAlarm() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 660
    osc.type = 'square'
    gain.gain.value = 0.4
    osc.start()
    setTimeout(() => { osc.frequency.value = 880 }, 200)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.stop(ctx.currentTime + 0.8)
  } catch {}
}

function Logo() {
  return (
    <div className="flex justify-center mb-4">
      <BrandLogo variant="light" className="h-10 w-auto" />
    </div>
  )
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00'
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CheckInPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<CheckInState>({ phase: 'loading' })
  const submittingRef = useRef(false)
  // Store facility info captured from the initial ready state
  const watchInfoRef = useRef<{ facilityName: string; assignedName: string } | null>(null)
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Capture facility info when entering ready state
  useEffect(() => {
    if (state.phase === 'ready') {
      watchInfoRef.current = {
        facilityName: state.facilityName,
        assignedName: state.assignedName,
      }
    }
  }, [state])

  // Add PWA manifest + service worker only on check-in page (not the marketing site)
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = '/manifest.webmanifest'
    document.head.appendChild(link)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
    return () => { document.head.removeChild(link) }
  }, [])

  // Validate token on mount
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

  // Auto-transition from confirmed to watching after 2 seconds
  useEffect(() => {
    if (state.phase !== 'confirmed') return
    const timer = setTimeout(() => {
      const info = watchInfoRef.current
      if (!info) return
      if (state.nextToken && state.nextCheckIn) {
        setState({
          phase: 'watching',
          facilityName: state.facilityName || info.facilityName,
          assignedName: state.assignedName || info.assignedName,
          nextCheckInTime: state.nextCheckIn,
          lastCheckInTime: state.serverTime,
          nextToken: state.nextToken,
        })
      }
      // If no nextToken, stay on confirmed (legacy behavior)
    }, 2000)
    return () => clearTimeout(timer)
  }, [state])

  // Countdown timer + phase transitions for watching/due/grace/missed_waiting
  useEffect(() => {
    if (state.phase !== 'watching' && state.phase !== 'due' && state.phase !== 'grace') return

    const interval = setInterval(() => {
      const now = Date.now()

      if (state.phase === 'watching') {
        const target = new Date(state.nextCheckInTime).getTime()
        if (now >= target) {
          playChime()
          try { navigator.vibrate?.([200, 100, 200]) } catch {}
          setState({
            phase: 'due',
            facilityName: state.facilityName,
            assignedName: state.assignedName,
            scheduledTime: state.nextCheckInTime,
            nextToken: state.nextToken,
          })
        }
      } else if (state.phase === 'due') {
        const target = new Date(state.scheduledTime).getTime()
        if (now >= target + 60_000) {
          playAlarm()
          try { navigator.vibrate?.([200, 100, 200]) } catch {}
          setState({
            phase: 'grace',
            facilityName: state.facilityName,
            assignedName: state.assignedName,
            scheduledTime: state.scheduledTime,
            nextToken: state.nextToken,
          })
        }
      } else if (state.phase === 'grace') {
        const target = new Date(state.scheduledTime).getTime()
        if (now >= target + 120_000) {
          if (alarmIntervalRef.current) {
            clearInterval(alarmIntervalRef.current)
            alarmIntervalRef.current = null
          }
          setState({
            phase: 'missed_waiting',
            facilityName: state.facilityName,
            assignedName: state.assignedName,
          })
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [state])

  // Repeating alarm in grace period
  useEffect(() => {
    if (state.phase === 'grace') {
      alarmIntervalRef.current = setInterval(() => {
        playAlarm()
        try { navigator.vibrate?.([200, 100, 200]) } catch {}
      }, 5000)
      return () => {
        if (alarmIntervalRef.current) {
          clearInterval(alarmIntervalRef.current)
          alarmIntervalRef.current = null
        }
      }
    }
  }, [state.phase])

  // Page Visibility: recalculate state when user returns
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      if (state.phase === 'watching') {
        const now = Date.now()
        const target = new Date(state.nextCheckInTime).getTime()
        if (now >= target + 120_000) {
          setState({
            phase: 'missed_waiting',
            facilityName: state.facilityName,
            assignedName: state.assignedName,
          })
        } else if (now >= target + 60_000) {
          playAlarm()
          try { navigator.vibrate?.([200, 100, 200]) } catch {}
          setState({
            phase: 'grace',
            facilityName: state.facilityName,
            assignedName: state.assignedName,
            scheduledTime: state.nextCheckInTime,
            nextToken: state.nextToken,
          })
        } else if (now >= target) {
          playChime()
          try { navigator.vibrate?.([200, 100, 200]) } catch {}
          setState({
            phase: 'due',
            facilityName: state.facilityName,
            assignedName: state.assignedName,
            scheduledTime: state.nextCheckInTime,
            nextToken: state.nextToken,
          })
        }
      } else if (state.phase === 'due') {
        const now = Date.now()
        const target = new Date(state.scheduledTime).getTime()
        if (now >= target + 120_000) {
          setState({
            phase: 'missed_waiting',
            facilityName: state.facilityName,
            assignedName: state.assignedName,
          })
        } else if (now >= target + 60_000) {
          playAlarm()
          setState({
            phase: 'grace',
            facilityName: state.facilityName,
            assignedName: state.assignedName,
            scheduledTime: state.scheduledTime,
            nextToken: state.nextToken,
          })
        }
      } else if (state.phase === 'grace') {
        const now = Date.now()
        const target = new Date(state.scheduledTime).getTime()
        if (now >= target + 120_000) {
          setState({
            phase: 'missed_waiting',
            facilityName: state.facilityName,
            assignedName: state.assignedName,
          })
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [state])

  const handleCheckIn = useCallback(async (overrideToken?: string) => {
    if (submittingRef.current) return
    submittingRef.current = true

    // Capture watch info before we change state
    const currentState = state
    let facilityName = ''
    let assignedName = ''
    if (currentState.phase === 'ready') {
      facilityName = currentState.facilityName
      assignedName = currentState.assignedName
    } else if (currentState.phase === 'due' || currentState.phase === 'grace') {
      facilityName = currentState.facilityName
      assignedName = currentState.assignedName
    }
    if (watchInfoRef.current) {
      facilityName = facilityName || watchInfoRef.current.facilityName
      assignedName = assignedName || watchInfoRef.current.assignedName
    }

    setState({ phase: 'submitting' })
    const deviceTime = new Date().toISOString()
    const location = await getLocation()
    const activeToken = overrideToken || token

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken,
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
        submittingRef.current = false
        return
      }
      // Service worker may return offline: true when network is down
      if (data.offline) {
        setState({ phase: 'queued', deviceTime, gpsCapture: location !== null })
        submittingRef.current = false
        return
      }

      // Update watchInfoRef with API response data
      if (data.facilityName) {
        watchInfoRef.current = {
          facilityName: data.facilityName || facilityName,
          assignedName: data.assignedName || assignedName,
        }
      }

      setState({
        phase: 'confirmed',
        nextCheckIn: data.nextCheckIn,
        serverTime: data.serverTime,
        gpsCapture: location !== null,
        facilityName: data.facilityName || facilityName,
        assignedName: data.assignedName || assignedName,
        nextToken: data.nextToken,
      })
    } catch {
      // Network error with no service worker -- try to queue directly
      try {
        await queueCheckin({
          token: activeToken,
          device_time: deviceTime,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          gps_accuracy: location?.accuracy ?? null,
        })
        setState({ phase: 'queued', deviceTime, gpsCapture: location !== null })
      } catch {
        setState({ phase: 'error', message: 'No internet connection. Please try again when you have signal.' })
      }
    }
    submittingRef.current = false
  }, [token, state])

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
        <div className="bg-red-950 border border-red-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-900 flex items-center justify-center">
            <span className="text-red-400 text-2xl font-bold">&#10005;</span>
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
        <div className="bg-amber-950 border border-amber-700 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-900 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>
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
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-900 flex items-center justify-center">
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
            className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl text-sm transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
        <div className="bg-green-950 border border-green-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-900 border-2 border-green-500 flex items-center justify-center">
            <span className="text-green-400 text-3xl font-bold">&#10003;</span>
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

          {/* Server timestamp */}
          <div className="bg-green-900 rounded-xl px-6 py-4 mb-4">
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1">Recorded At</p>
            <p className="text-white text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {format(new Date(state.serverTime), 'h:mm:ss a')}
            </p>
            <p className="text-green-400 text-xs mt-1">
              {format(new Date(state.serverTime), 'EEEE, MMM d')}
            </p>
          </div>

          {/* Next check-in */}
          <div className="bg-slate-900 rounded-xl px-6 py-4 mb-5 border border-slate-800">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Next Check-In Due</p>
            <p className="text-white text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {format(new Date(state.nextCheckIn), 'h:mm a')}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {format(new Date(state.nextCheckIn), 'EEEE, MMM d')}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-4">
            {state.gpsCapture ? (
              <span className="text-[10px] text-green-500 font-semibold">Location recorded</span>
            ) : (
              <span className="text-[10px] text-slate-500">Location not captured — GPS unavailable</span>
            )}
          </div>
          {state.nextToken ? (
            <p className="text-slate-500 text-xs">
              Transitioning to watch mode...
            </p>
          ) : (
            <p className="text-slate-500 text-xs">
              You will receive a new check-in link when that window opens.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (state.phase === 'queued') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-amber-950 border border-amber-700 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-900 border-2 border-amber-500 flex items-center justify-center">
            <span className="text-amber-400 text-3xl font-bold">&#10003;</span>
          </div>
          <h1
            className="text-2xl text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Check-In Queued
          </h1>
          <p className="text-amber-300 text-sm mb-6">
            Your check-in has been saved and will sync when you&apos;re back online.
          </p>

          {/* Device timestamp */}
          <div className="bg-amber-900 rounded-xl px-6 py-4 mb-5">
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">Recorded At (Device)</p>
            <p className="text-white text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {format(new Date(state.deviceTime), 'h:mm:ss a')}
            </p>
            <p className="text-amber-400 text-xs mt-1">
              {format(new Date(state.deviceTime), 'EEEE, MMM d')}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-4">
            {state.gpsCapture ? (
              <span className="text-[10px] text-green-500 font-semibold">Location recorded</span>
            ) : (
              <span className="text-[10px] text-slate-500">Location not captured — GPS unavailable</span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <span className="text-amber-400 text-xs font-semibold">Waiting for connection...</span>
          </div>
          <p className="text-slate-500 text-xs">
            Keep this page open or close it — your check-in will sync automatically when service returns.
          </p>
        </div>
      </div>
    )
  }

  if (state.phase === 'submitting') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center" role="status" aria-label="Recording check-in">
        <Logo />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-10 h-10 mx-auto mb-4 border-3 border-slate-700 border-t-green-500 rounded-full animate-spin" aria-hidden="true" />
          <h1
            className="text-xl text-white mb-1"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Recording check-in...
          </h1>
          <p className="text-slate-500 text-xs">Recording your check-in. Do not close.</p>
        </div>
      </div>
    )
  }

  if (state.phase === 'watching') {
    return (
      <WatchingView
        facilityName={state.facilityName}
        assignedName={state.assignedName}
        nextCheckInTime={state.nextCheckInTime}
        lastCheckInTime={state.lastCheckInTime}
      />
    )
  }

  if (state.phase === 'due') {
    return (
      <DueView
        facilityName={state.facilityName}
        assignedName={state.assignedName}
        scheduledTime={state.scheduledTime}
        onCheckIn={() => handleCheckIn(state.nextToken)}
      />
    )
  }

  if (state.phase === 'grace') {
    return (
      <GraceView
        facilityName={state.facilityName}
        assignedName={state.assignedName}
        scheduledTime={state.scheduledTime}
        onCheckIn={() => handleCheckIn(state.nextToken)}
      />
    )
  }

  if (state.phase === 'missed_waiting') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-red-950 border border-red-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-900 flex items-center justify-center">
            <span className="text-red-400 text-2xl font-bold">&#10005;</span>
          </div>
          <h1
            className="text-2xl text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Window Expired
          </h1>
          <p className="text-red-300 text-sm mb-4">
            This check-in was missed. Your supervisor has been notified.
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 mt-4">
            <p className="text-slate-400 text-sm">
              {state.facilityName}
            </p>
            <p className="text-slate-500 text-xs mt-1">{state.assignedName}</p>
          </div>
          <p className="text-slate-500 text-xs mt-4">
            Your next check-in link will arrive shortly.
          </p>
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
      onCheckIn={() => handleCheckIn()}
    />
  )
}

// ===== WATCHING VIEW (countdown) =====

function WatchingView({
  facilityName,
  assignedName,
  nextCheckInTime,
  lastCheckInTime,
}: {
  facilityName: string
  assignedName: string
  nextCheckInTime: string
  lastCheckInTime: string
}) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(0, Math.floor((new Date(nextCheckInTime).getTime() - Date.now()) / 1000))
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(nextCheckInTime).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }, 1000)
    return () => clearInterval(interval)
  }, [nextCheckInTime])

  const totalInterval = Math.max(1, Math.floor((new Date(nextCheckInTime).getTime() - new Date(lastCheckInTime).getTime()) / 1000))
  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / totalInterval))

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Logo />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Watch info header */}
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">On Schedule</span>
            </div>
            <h1
              className="text-white text-xl mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              {facilityName}
            </h1>
            <p className="text-slate-400 text-sm">{assignedName}</p>
          </div>

          {/* Countdown */}
          <div className="px-6 py-8 text-center">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-3">Next Check-In In</p>
            <p
              className="text-white text-6xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCountdown(secondsLeft)}
            </p>
            <p className="text-slate-500 text-sm mt-3">
              Due at {format(new Date(nextCheckInTime), 'h:mm a')}
            </p>

            {/* Progress bar */}
            <div className="mt-6 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Footer info */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50">
            <p className="text-slate-600 text-xs text-center">
              Keep this page open. You will be alerted when it is time to check in.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== DUE VIEW (check-in available) =====

function DueView({
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
  const [tapped, setTapped] = useState(false)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const goOnline = () => {
      setOnline(true)
      syncPendingCheckins().catch(() => {})
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Logo />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-4">
          {/* Info header */}
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Due Now</span>
            </div>
            <h1
              className="text-white text-xl mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              {facilityName}
            </h1>
            <p className="text-slate-400 text-sm">{assignedName}</p>
            <p className="text-slate-500 text-sm mt-1">
              Due: <span className="text-white font-bold">{format(new Date(scheduledTime), 'h:mm a')}</span>
            </p>
          </div>

          {/* Connectivity indicator */}
          {!online && (
            <div className="px-6 py-3 bg-amber-950 border-t border-amber-800 flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-amber-400 text-xs font-semibold">Offline — check-in will be queued</span>
            </div>
          )}

          {/* The big button */}
          <div className="p-6">
            <button
              onClick={() => { setTapped(true); onCheckIn() }}
              disabled={tapped}
              aria-label={`Check in now at ${facilityName}`}
              className="w-full py-8 bg-green-500 hover:bg-green-400 active:bg-green-600 disabled:bg-green-800 disabled:text-green-300 text-white text-2xl font-black rounded-2xl shadow-2xl shadow-green-900/50 transition-all select-none touch-manipulation active:scale-[0.97] disabled:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
            >
              {tapped ? 'Checking in...' : 'CHECK IN NOW'}
            </button>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center max-w-xs mx-auto leading-relaxed">
          Tap the button to record your check-in.
        </p>
      </div>
    </div>
  )
}

// ===== GRACE VIEW (overdue, red screen) =====

function GraceView({
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
  const [tapped, setTapped] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-5 transition-colors duration-500 ${pulse ? 'bg-red-950' : 'bg-red-900'}`}>
      <div className="w-full max-w-sm">
        <Logo />

        <div className={`border rounded-2xl overflow-hidden mb-4 transition-colors duration-500 ${pulse ? 'bg-red-900 border-red-600' : 'bg-red-950 border-red-700'}`}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Overdue</span>
            </div>
            <h1
              className="text-white text-xl mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              {facilityName}
            </h1>
            <p className="text-red-300 text-sm">{assignedName}</p>
            <p className="text-red-400 text-sm mt-1">
              Due: <span className="text-white font-bold">{format(new Date(scheduledTime), 'h:mm a')}</span>
            </p>
          </div>

          {/* Overdue message */}
          <div className="px-6 py-6 text-center">
            <p
              className="text-red-300 text-3xl font-black mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              OVERDUE
            </p>
            <p className="text-red-400 text-sm">CHECK IN NOW</p>
          </div>

          {/* The button */}
          <div className="p-6 pt-0">
            <button
              onClick={() => { setTapped(true); onCheckIn() }}
              disabled={tapped}
              aria-label={`Check in now - overdue at ${facilityName}`}
              className="w-full py-8 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-red-900 disabled:text-red-400 text-white text-2xl font-black rounded-2xl border-2 border-red-400 shadow-2xl shadow-red-900/50 transition-all select-none touch-manipulation active:scale-[0.97] disabled:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
            >
              {tapped ? 'Checking in...' : 'CHECK IN NOW'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== READY VIEW (initial check-in) =====

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
  const [online, setOnline] = useState(true)
  const [tapped, setTapped] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setOnline(navigator.onLine)
    const goOnline = () => {
      setOnline(true)
      // Safari fallback: sync queued check-ins when back online
      syncPendingCheckins().catch(() => {})
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
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

          {/* Connectivity indicator */}
          {!online && (
            <div className="px-6 py-3 bg-amber-950 border-t border-amber-800 flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-amber-400 text-xs font-semibold">Offline — check-in will be queued</span>
            </div>
          )}

          {/* The big button */}
          <div className="p-6">
            <button
              onClick={() => { setTapped(true); onCheckIn() }}
              disabled={tapped}
              aria-label={`Check in now at ${facilityName}`}
              className="w-full py-8 bg-green-500 hover:bg-green-400 active:bg-green-600 disabled:bg-green-800 disabled:text-green-300 text-white text-2xl font-black rounded-2xl shadow-2xl shadow-green-900/50 transition-all select-none touch-manipulation active:scale-[0.97] disabled:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
            >
              {tapped ? 'Checking in...' : 'CHECK IN NOW'}
            </button>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center max-w-xs mx-auto leading-relaxed">
          Tap the button to record your check-in. GPS is captured if your browser allows it — if not, your check-in still records without location.
          Your next check-in link will be available when the next window opens.
        </p>
      </div>
    </div>
  )
}
