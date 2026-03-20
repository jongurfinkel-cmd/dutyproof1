'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import { format } from 'date-fns'
import { queueCheckin, syncPendingCheckins, cleanupOldEntries, getPendingCount } from '@/lib/offline-queue'

type CheckInState =
  | { phase: 'loading' }
  | { phase: 'expired'; message: string }
  | { phase: 'invalid'; message: string }
  | { phase: 'checklist_pending'; message: string }
  | { phase: 'ready'; facilityName: string; location: string | null; assignedName: string; scheduledTime: string; nextTime: string; watchLatitude: number | null; watchLongitude: number | null; watchRadiusM: number; escalationPhone: string | null }
  | { phase: 'submitting' }
  | { phase: 'confirmed'; nextCheckIn: string; serverTime: string; gpsCapture: boolean; facilityName: string; assignedName: string; nextToken?: string }
  | { phase: 'queued'; deviceTime: string; gpsCapture: boolean }
  | { phase: 'watching'; facilityName: string; assignedName: string; nextCheckInTime: string; lastCheckInTime: string; nextToken?: string }
  | { phase: 'due'; facilityName: string; assignedName: string; scheduledTime: string; nextToken?: string }
  | { phase: 'grace'; facilityName: string; assignedName: string; scheduledTime: string; nextToken?: string }
  | { phase: 'missed_waiting'; facilityName: string; assignedName: string }
  | { phase: 'error'; message: string }

// Persistent watch metadata
interface WatchMeta {
  facilityName: string
  assignedName: string
  location: string | null
  watchLatitude: number | null
  watchLongitude: number | null
  watchRadiusM: number
  escalationPhone: string | null
}

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

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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

// ===== GEOFENCE STATUS BADGE =====
function GeofenceBadge({ userLat, userLng, watchLat, watchLng, radius }: {
  userLat: number | null; userLng: number | null;
  watchLat: number | null; watchLng: number | null;
  radius: number;
}) {
  if (watchLat == null || watchLng == null || userLat == null || userLng == null) return null
  const dist = distanceMeters(watchLat, watchLng, userLat, userLng)
  const inside = dist <= radius
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${inside ? 'bg-green-900/50 border border-green-700 text-green-400' : 'bg-red-900/50 border border-red-700 text-red-400'}`}>
      <span className={`w-2 h-2 rounded-full ${inside ? 'bg-green-500' : 'bg-red-500'}`} />
      {inside ? 'Inside watch zone' : 'Outside watch zone'}
      <span className="text-slate-500 font-normal">({Math.round(dist)}m)</span>
    </div>
  )
}

// ===== CALL SUPERVISOR BUTTON =====
function CallSupervisorButton({ phone }: { phone: string | null }) {
  if (!phone) return null
  return (
    <a
      href={`tel:${phone}`}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-all active:scale-[0.97]"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      Call Supervisor
    </a>
  )
}

// ===== WAKE LOCK HOOK =====
function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    async function acquire() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch {}
    }
    acquire()

    // Re-acquire on visibility change (iOS Safari releases on tab switch)
    function handleVisibility() {
      if (document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [])
}

export default function CheckInPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<CheckInState>({ phase: 'loading' })
  const submittingRef = useRef(false)
  const watchMetaRef = useRef<WatchMeta | null>(null)
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [online, setOnline] = useState(true)
  const [syncToast, setSyncToast] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  // Keep screen awake during the entire watch
  useWakeLock()

  // Global connectivity monitor + auto-sync
  useEffect(() => {
    setOnline(navigator.onLine)

    const goOnline = async () => {
      setOnline(true)
      try {
        const result = await syncPendingCheckins()
        if (result.synced > 0 || result.reconciled > 0) {
          const parts: string[] = []
          if (result.synced > 0) parts.push(`${result.synced} synced`)
          if (result.reconciled > 0) parts.push(`${result.reconciled} reconciled`)
          setSyncToast(parts.join(', '))
          setTimeout(() => setSyncToast(null), 5000)
        }
        setPendingCount(await getPendingCount())
      } catch {}
    }
    const goOffline = () => setOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    // Listen for service worker messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'checkins-synced') {
        setSyncToast(`${event.data.count} check-in(s) synced from background`)
        setTimeout(() => setSyncToast(null), 5000)
        getPendingCount().then(setPendingCount).catch(() => {})
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleSWMessage)

    // Initial pending count + cleanup
    getPendingCount().then(setPendingCount).catch(() => {})
    cleanupOldEntries(24).catch(() => {})

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
    }
  }, [])

  // Capture user location on mount for geofence display
  useEffect(() => {
    getLocation().then(loc => {
      if (loc) setUserLocation({ latitude: loc.latitude, longitude: loc.longitude })
    })
  }, [])

  // Capture watch meta when entering ready state
  useEffect(() => {
    if (state.phase === 'ready') {
      watchMetaRef.current = {
        facilityName: state.facilityName,
        assignedName: state.assignedName,
        location: state.location,
        watchLatitude: state.watchLatitude,
        watchLongitude: state.watchLongitude,
        watchRadiusM: state.watchRadiusM,
        escalationPhone: state.escalationPhone,
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
          location: data.location ?? null,
          assignedName: data.assignedName,
          scheduledTime: data.scheduledTime,
          nextTime: data.nextTime,
          watchLatitude: data.watchLatitude ?? null,
          watchLongitude: data.watchLongitude ?? null,
          watchRadiusM: data.watchRadiusM ?? 100,
          escalationPhone: data.escalationPhone ?? null,
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
      const info = watchMetaRef.current
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
      // Re-acquire GPS on return
      getLocation().then(loc => {
        if (loc) setUserLocation({ latitude: loc.latitude, longitude: loc.longitude })
      })

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
    if (watchMetaRef.current) {
      facilityName = facilityName || watchMetaRef.current.facilityName
      assignedName = assignedName || watchMetaRef.current.assignedName
    }

    setState({ phase: 'submitting' })
    const deviceTime = new Date().toISOString()
    const location = await getLocation()
    if (location) setUserLocation({ latitude: location.latitude, longitude: location.longitude })
    const activeToken = overrideToken || token
    const trimmedNotes = notes.trim() || null

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
          notes: trimmedNotes,
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

      // Update watchMetaRef with API response data
      if (data.facilityName && watchMetaRef.current) {
        watchMetaRef.current.facilityName = data.facilityName || facilityName
        watchMetaRef.current.assignedName = data.assignedName || assignedName
        if (data.watchLatitude != null) watchMetaRef.current.watchLatitude = data.watchLatitude
        if (data.watchLongitude != null) watchMetaRef.current.watchLongitude = data.watchLongitude
        if (data.watchRadiusM != null) watchMetaRef.current.watchRadiusM = data.watchRadiusM
        if (data.escalationPhone !== undefined) watchMetaRef.current.escalationPhone = data.escalationPhone
      }

      // Clear notes after successful check-in
      setNotes('')
      setShowNotes(false)

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
          notes: trimmedNotes,
        })
        setState({ phase: 'queued', deviceTime, gpsCapture: location !== null })
      } catch {
        setState({ phase: 'error', message: 'No internet connection. Please try again when you have signal.' })
      }
    }
    submittingRef.current = false
  }, [token, state, notes])

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
          {watchMetaRef.current?.escalationPhone && (
            <div className="mt-4">
              <CallSupervisorButton phone={watchMetaRef.current.escalationPhone} />
            </div>
          )}
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
          {watchMetaRef.current?.escalationPhone && (
            <div className="mt-3">
              <CallSupervisorButton phone={watchMetaRef.current.escalationPhone} />
            </div>
          )}
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

          {/* Geofence status after check-in */}
          {watchMetaRef.current?.watchLatitude != null && (
            <div className="mb-4 flex justify-center">
              <GeofenceBadge
                userLat={userLocation?.latitude ?? null}
                userLng={userLocation?.longitude ?? null}
                watchLat={watchMetaRef.current.watchLatitude}
                watchLng={watchMetaRef.current.watchLongitude}
                radius={watchMetaRef.current.watchRadiusM}
              />
            </div>
          )}

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
          <p className="text-slate-500 text-xs">Capturing GPS and recording. Do not close.</p>
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
        watchMeta={watchMetaRef.current}
        userLocation={userLocation}
        online={online}
        syncToast={syncToast}
        pendingCount={pendingCount}
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
        watchMeta={watchMetaRef.current}
        userLocation={userLocation}
        notes={notes}
        onNotesChange={setNotes}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes(v => !v)}
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
        watchMeta={watchMetaRef.current}
        userLocation={userLocation}
        notes={notes}
        onNotesChange={setNotes}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes(v => !v)}
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
          {watchMetaRef.current?.escalationPhone && (
            <div className="mt-4">
              <CallSupervisorButton phone={watchMetaRef.current.escalationPhone} />
            </div>
          )}
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
      watchMeta={watchMetaRef.current}
      userLocation={userLocation}
      notes={notes}
      onNotesChange={setNotes}
      showNotes={showNotes}
      onToggleNotes={() => setShowNotes(v => !v)}
    />
  )
}

// ===== WATCHING VIEW (countdown) =====

function WatchingView({
  facilityName,
  assignedName,
  nextCheckInTime,
  lastCheckInTime,
  watchMeta,
  userLocation,
  online,
  syncToast,
  pendingCount,
}: {
  facilityName: string
  assignedName: string
  nextCheckInTime: string
  lastCheckInTime: string
  watchMeta: WatchMeta | null
  userLocation: { latitude: number; longitude: number } | null
  online: boolean
  syncToast: string | null
  pendingCount: number
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

          {/* Geofence status */}
          {watchMeta?.watchLatitude != null && (
            <div className="px-6 pt-4">
              <GeofenceBadge
                userLat={userLocation?.latitude ?? null}
                userLng={userLocation?.longitude ?? null}
                watchLat={watchMeta.watchLatitude}
                watchLng={watchMeta.watchLongitude}
                radius={watchMeta.watchRadiusM}
              />
            </div>
          )}

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

          {/* Connectivity + sync status */}
          {!online && (
            <div className="mx-6 mt-0 mb-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-950 border border-red-800">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400 text-xs font-semibold">No connection — check-ins will be queued</span>
            </div>
          )}

          {pendingCount > 0 && online && (
            <div className="mx-6 mt-0 mb-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-950 border border-amber-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-amber-400 text-xs font-semibold">Syncing {pendingCount} queued check-in(s)...</span>
            </div>
          )}

          {syncToast && (
            <div className="mx-6 mt-0 mb-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-950 border border-green-800">
              <span className="text-green-400 text-xs font-semibold">{syncToast}</span>
            </div>
          )}

          {/* Footer info */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 space-y-2">
            <p className="text-slate-600 text-xs text-center">
              {online
                ? 'Keep this page open. You will be alerted when it is time to check in.'
                : 'You are offline. Your check-in will be queued and synced when connection returns.'}
            </p>
            {watchMeta?.escalationPhone && (
              <CallSupervisorButton phone={watchMeta.escalationPhone} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== NOTES INPUT =====
function NotesInput({ notes, onChange, show, onToggle }: {
  notes: string; onChange: (v: string) => void; show: boolean; onToggle: () => void
}) {
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors mb-2"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        {show ? 'Hide notes' : 'Add a note (optional)'}
      </button>
      {show && (
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Site conditions, observations, concerns..."
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      )}
    </div>
  )
}

// ===== DUE VIEW (check-in available) =====

function DueView({
  facilityName,
  assignedName,
  scheduledTime,
  onCheckIn,
  watchMeta,
  userLocation,
  notes,
  onNotesChange,
  showNotes,
  onToggleNotes,
}: {
  facilityName: string
  assignedName: string
  scheduledTime: string
  onCheckIn: () => void
  watchMeta: WatchMeta | null
  userLocation: { latitude: number; longitude: number } | null
  notes: string
  onNotesChange: (v: string) => void
  showNotes: boolean
  onToggleNotes: () => void
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

          {/* Geofence status */}
          {watchMeta?.watchLatitude != null && (
            <div className="px-6 pt-4">
              <GeofenceBadge
                userLat={userLocation?.latitude ?? null}
                userLng={userLocation?.longitude ?? null}
                watchLat={watchMeta.watchLatitude}
                watchLng={watchMeta.watchLongitude}
                radius={watchMeta.watchRadiusM}
              />
            </div>
          )}

          {/* Connectivity indicator */}
          {!online && (
            <div className="px-6 py-3 bg-amber-950 border-t border-amber-800 flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-amber-400 text-xs font-semibold">Offline — check-in will be queued</span>
            </div>
          )}

          {/* Notes input */}
          <div className="px-6 pt-4">
            <NotesInput notes={notes} onChange={onNotesChange} show={showNotes} onToggle={onToggleNotes} />
          </div>

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

        {/* Supervisor contact */}
        {watchMeta?.escalationPhone && (
          <div className="mb-4">
            <CallSupervisorButton phone={watchMeta.escalationPhone} />
          </div>
        )}

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
  watchMeta,
  userLocation,
  notes,
  onNotesChange,
  showNotes,
  onToggleNotes,
}: {
  facilityName: string
  assignedName: string
  scheduledTime: string
  onCheckIn: () => void
  watchMeta: WatchMeta | null
  userLocation: { latitude: number; longitude: number } | null
  notes: string
  onNotesChange: (v: string) => void
  showNotes: boolean
  onToggleNotes: () => void
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

          {/* Geofence status */}
          {watchMeta?.watchLatitude != null && (
            <div className="px-6 pt-4">
              <GeofenceBadge
                userLat={userLocation?.latitude ?? null}
                userLng={userLocation?.longitude ?? null}
                watchLat={watchMeta.watchLatitude}
                watchLng={watchMeta.watchLongitude}
                radius={watchMeta.watchRadiusM}
              />
            </div>
          )}

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

          {/* Notes input */}
          <div className="px-6 pb-2">
            <NotesInput notes={notes} onChange={onNotesChange} show={showNotes} onToggle={onToggleNotes} />
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

        {/* Supervisor contact */}
        {watchMeta?.escalationPhone && (
          <div className="mb-4">
            <CallSupervisorButton phone={watchMeta.escalationPhone} />
          </div>
        )}
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
  watchMeta,
  userLocation,
  notes,
  onNotesChange,
  showNotes,
  onToggleNotes,
}: {
  facilityName: string
  assignedName: string
  scheduledTime: string
  onCheckIn: () => void
  watchMeta: WatchMeta | null
  userLocation: { latitude: number; longitude: number } | null
  notes: string
  onNotesChange: (v: string) => void
  showNotes: boolean
  onToggleNotes: () => void
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

          {/* Geofence status */}
          {watchMeta?.watchLatitude != null && (
            <div className="px-6 pt-4">
              <GeofenceBadge
                userLat={userLocation?.latitude ?? null}
                userLng={userLocation?.longitude ?? null}
                watchLat={watchMeta.watchLatitude}
                watchLng={watchMeta.watchLongitude}
                radius={watchMeta.watchRadiusM}
              />
            </div>
          )}

          {/* Connectivity indicator */}
          {!online && (
            <div className="px-6 py-3 bg-amber-950 border-t border-amber-800 flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-amber-400 text-xs font-semibold">Offline — check-in will be queued</span>
            </div>
          )}

          {/* Notes input */}
          <div className="px-6 pt-4">
            <NotesInput notes={notes} onChange={onNotesChange} show={showNotes} onToggle={onToggleNotes} />
          </div>

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

        {/* Supervisor contact */}
        {watchMeta?.escalationPhone && (
          <div className="mb-4">
            <CallSupervisorButton phone={watchMeta.escalationPhone} />
          </div>
        )}

        <p className="text-slate-600 text-xs text-center max-w-xs mx-auto leading-relaxed">
          Tap the button to record your check-in. GPS is captured automatically.
          Your next check-in link will be available when the next window opens.
        </p>
      </div>
    </div>
  )
}
