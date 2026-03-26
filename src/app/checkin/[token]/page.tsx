'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'
import { format } from 'date-fns'
import { queueCheckin, syncPendingCheckins, cleanupOldEntries, getPendingCount, cacheWatchConfig, getCachedWatchConfig, type CachedWatchConfig } from '@/lib/offline-queue'
import { addMinutes } from 'date-fns'

type GpsPermission = 'unknown' | 'checking' | 'granted' | 'denied' | 'unavailable' | 'dismissed'

type CheckInState =
  | { phase: 'loading' }
  | { phase: 'gps_prompt' }
  | { phase: 'expired'; message: string }
  | { phase: 'invalid'; message: string }
  | { phase: 'checklist_pending'; message: string; checklistToken?: string }
  | { phase: 'ready'; facilityName: string; location: string | null; assignedName: string; scheduledTime: string; nextTime: string; watchLatitude: number | null; watchLongitude: number | null; watchRadiusM: number; escalationPhone: string | null }
  | { phase: 'submitting' }
  | { phase: 'confirmed'; nextCheckIn: string; serverTime: string; gpsCapture: boolean; facilityName: string; assignedName: string; nextToken?: string }
  | { phase: 'queued'; deviceTime: string; gpsCapture: boolean }
  | { phase: 'watching'; facilityName: string; assignedName: string; nextCheckInTime: string; lastCheckInTime: string; nextToken?: string }
  | { phase: 'due'; facilityName: string; assignedName: string; scheduledTime: string; nextToken?: string }
  | { phase: 'grace'; facilityName: string; assignedName: string; scheduledTime: string; nextToken?: string }
  | { phase: 'missed_waiting'; facilityName: string; assignedName: string }
  | { phase: 'watch_complete'; facilityName: string; assignedName: string; startTime: string; endedAt: string; totalCheckIns: number; completedCheckIns: number; missedCheckIns: number }
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

// Session config for offline-first mode
interface SessionConfig {
  watchId: string
  sessionToken: string
  facilityName: string
  location: string | null
  assignedName: string
  interval: number // minutes
  startTime: string
  plannedEndTime: string | null
  watchLatitude: number | null
  watchLongitude: number | null
  watchRadiusM: number
  escalationPhone: string | null
  postWorkDurationMin: number
  workStoppedAt: string | null
  lastCompletedAt: string | null
  serverClockOffset: number // ms: serverTime - clientTime
}

/** Compute the next scheduled check-in time given session config and last completed time */
function computeNextScheduledTime(config: SessionConfig): Date {
  const interval = config.interval
  const start = new Date(config.startTime)
  const now = new Date()
  const lastCompleted = config.lastCompletedAt ? new Date(config.lastCompletedAt) : null

  // If we have a last completed check-in, next is last + interval
  if (lastCompleted) {
    return addMinutes(lastCompleted, interval)
  }

  // Otherwise, find the next slot from start_time
  // Walk forward from start_time by interval until we find a time >= now - interval
  let slot = start
  while (addMinutes(slot, interval).getTime() < now.getTime()) {
    slot = addMinutes(slot, interval)
  }
  return slot
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

// ===== GPS WARNING BANNER =====
function GpsWarningBanner({ status, accuracy }: { status: GpsPermission; accuracy: number | null }) {
  if (status === 'granted' && accuracy !== null) return null
  if (status === 'granted') return null
  if (status === 'unknown' || status === 'checking') return null

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mb-3 ${
      status === 'denied' || status === 'unavailable'
        ? 'bg-red-950 border border-red-800 text-red-400'
        : 'bg-amber-950 border border-amber-800 text-amber-400'
    }`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {status === 'denied' ? 'Location denied — check-ins have no GPS proof' :
       status === 'unavailable' ? 'GPS unavailable — check-ins have no location data' :
       'Location not enabled — check-ins may lack GPS proof'}
    </div>
  )
}

// ===== GPS ACCURACY PILL =====
function GpsAccuracyPill({ accuracy }: { accuracy: number | null }) {
  if (accuracy === null) return null
  const good = accuracy <= 20
  const ok = accuracy <= 50
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      good ? 'bg-green-900/50 border border-green-800 text-green-400' :
      ok ? 'bg-amber-900/50 border border-amber-800 text-amber-400' :
      'bg-red-900/50 border border-red-800 text-red-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${good ? 'bg-green-500' : ok ? 'bg-amber-500' : 'bg-red-500'}`} />
      GPS ±{Math.round(accuracy)}m
    </span>
  )
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
  const lastSubmitTime = useRef(0)
  const watchMetaRef = useRef<WatchMeta | null>(null)
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null)
  const [gpsPermission, setGpsPermission] = useState<GpsPermission>('unknown')
  const gpsWatchIdRef = useRef<number | null>(null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [online, setOnline] = useState(true)
  const [syncToast, setSyncToast] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [postWorkMin, setPostWorkMin] = useState(0)
  const [workStopped, setWorkStopped] = useState(false)
  const [stoppingWork, setStoppingWork] = useState(false)
  const sessionRef = useRef<SessionConfig | null>(null)
  const [isSessionMode, setIsSessionMode] = useState(false)
  const [localCheckInCount, setLocalCheckInCount] = useState(0)
  const gpsGatePassedRef = useRef(false) // true once user has seen/dismissed GPS prompt

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

  // Continuous GPS tracking — keeps location fresh for geofence and check-ins
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsPermission('unavailable')
      return
    }

    // Check permission state if available (Chrome/Edge)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') setGpsPermission('granted')
        else if (result.state === 'denied') setGpsPermission('denied')
        else setGpsPermission('unknown') // 'prompt'
        result.addEventListener('change', () => {
          if (result.state === 'granted') setGpsPermission('granted')
          else if (result.state === 'denied') setGpsPermission('denied')
        })
      }).catch(() => {})
    }

    // Start watching position
    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setGpsPermission('granted')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGpsPermission('denied')
        else if (err.code === err.POSITION_UNAVAILABLE) setGpsPermission('unavailable')
        // TIMEOUT — keep trying, don't change status
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
    )

    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current)
      }
    }
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

  // Pending state held while GPS prompt is shown
  const pendingStateRef = useRef<CheckInState | null>(null)

  // Gate: show GPS prompt before entering active phases (first time only)
  const gateGps = useCallback((nextState: CheckInState) => {
    if (gpsGatePassedRef.current || gpsPermission === 'granted') {
      gpsGatePassedRef.current = true
      setState(nextState)
    } else {
      // Hold the state and show GPS prompt first
      pendingStateRef.current = nextState
      setState({ phase: 'gps_prompt' })
    }
  }, [gpsPermission])

  // When GPS prompt is resolved (granted or dismissed), apply the pending state
  useEffect(() => {
    if (state.phase === 'loading' && pendingStateRef.current && (gpsPermission === 'granted' || gpsPermission === 'dismissed')) {
      gpsGatePassedRef.current = true
      const pending = pendingStateRef.current
      pendingStateRef.current = null
      setState(pending)
    }
  }, [state.phase, gpsPermission])

  // Initialize session from server or cache
  const initSession = useCallback((config: SessionConfig) => {
    sessionRef.current = config
    setIsSessionMode(true)
    setPostWorkMin(config.postWorkDurationMin)
    setWorkStopped(!!config.workStoppedAt)

    watchMetaRef.current = {
      facilityName: config.facilityName,
      assignedName: config.assignedName,
      location: config.location,
      watchLatitude: config.watchLatitude,
      watchLongitude: config.watchLongitude,
      watchRadiusM: config.watchRadiusM,
      escalationPhone: config.escalationPhone,
    }

    // Compute current position in the schedule
    const nextScheduled = computeNextScheduledTime(config)
    const now = Date.now()
    const diff = nextScheduled.getTime() - now

    if (diff > 0) {
      const lastTime = config.lastCompletedAt ?? config.startTime
      gateGps({
        phase: 'watching',
        facilityName: config.facilityName,
        assignedName: config.assignedName,
        nextCheckInTime: nextScheduled.toISOString(),
        lastCheckInTime: lastTime,
      })
    } else {
      gateGps({
        phase: 'ready',
        facilityName: config.facilityName,
        location: config.location,
        assignedName: config.assignedName,
        scheduledTime: nextScheduled.toISOString(),
        nextTime: addMinutes(nextScheduled, config.interval).toISOString(),
        watchLatitude: config.watchLatitude,
        watchLongitude: config.watchLongitude,
        watchRadiusM: config.watchRadiusM,
        escalationPhone: config.escalationPhone,
      })
    }
  }, [gateGps])

  // Validate token on mount — try session mode first, then legacy, then cache
  useEffect(() => {
    async function validate() {
      // Try session mode first
      try {
        const sessionRes = await fetch(`/api/checkin/validate?session=${encodeURIComponent(token)}`)
        if (sessionRes.ok) {
          const data = await sessionRes.json()
          if (data.mode === 'session') {
            const config: SessionConfig = {
              watchId: data.watchId,
              sessionToken: data.sessionToken,
              facilityName: data.facilityName,
              location: data.location,
              assignedName: data.assignedName,
              interval: data.interval,
              startTime: data.startTime,
              plannedEndTime: data.plannedEndTime,
              watchLatitude: data.watchLatitude,
              watchLongitude: data.watchLongitude,
              watchRadiusM: data.watchRadiusM,
              escalationPhone: data.escalationPhone,
              postWorkDurationMin: data.postWorkDurationMin,
              workStoppedAt: data.workStoppedAt,
              lastCompletedAt: data.lastCompletedAt,
              serverClockOffset: new Date(data.serverTime).getTime() - Date.now(),
            }
            // Cache config for offline use
            await cacheWatchConfig({
              ...config,
              serverTime: data.serverTime,
              checklistCompletedAt: data.checklistCompletedAt,
              cachedAt: new Date().toISOString(),
            }).catch(() => {})
            initSession(config)
            return
          }
        }

        // Session lookup failed — check error type
        if (sessionRes.status === 409) {
          const data = await sessionRes.json()
          if (data.error === 'checklist_pending') {
            setState({ phase: 'checklist_pending', message: data.message, checklistToken: data.checklistToken })
            return
          }
        }
        if (sessionRes.status === 410) {
          const data = await sessionRes.json()
          if (data.error === 'watch_completed' && data.totalCheckIns != null) {
            setState({
              phase: 'watch_complete',
              facilityName: data.facilityName,
              assignedName: data.assignedName,
              startTime: data.startTime,
              endedAt: data.endedAt,
              totalCheckIns: data.totalCheckIns,
              completedCheckIns: data.completedCheckIns,
              missedCheckIns: data.missedCheckIns,
            })
          } else {
            setState({ phase: 'expired', message: data.error ?? 'This fire watch has ended.' })
          }
          return
        }

        // Not a session token — try legacy token
        if (sessionRes.status === 404) {
          const legacyRes = await fetch(`/api/checkin/validate?token=${encodeURIComponent(token)}`)
          const data = await legacyRes.json()

          if (!legacyRes.ok) {
            if (legacyRes.status === 410 && data.error === 'watch_completed' && data.totalCheckIns != null) {
              setState({
                phase: 'watch_complete',
                facilityName: data.facilityName,
                assignedName: data.assignedName,
                startTime: data.startTime,
                endedAt: data.endedAt,
                totalCheckIns: data.totalCheckIns,
                completedCheckIns: data.completedCheckIns,
                missedCheckIns: data.missedCheckIns,
              })
            } else if (legacyRes.status === 410) {
              setState({ phase: 'expired', message: data.error ?? 'This check-in window has expired.' })
            } else if (legacyRes.status === 409 && data.error === 'checklist_pending') {
              setState({ phase: 'checklist_pending', message: data.message, checklistToken: data.checklistToken })
            } else {
              setState({ phase: 'invalid', message: data.error ?? 'Invalid check-in link.' })
            }
            return
          }

          // If the legacy response tells us to switch to session mode
          if (data.redirect === 'session' && data.sessionToken) {
            const sRes = await fetch(`/api/checkin/validate?session=${encodeURIComponent(data.sessionToken)}`)
            if (sRes.ok) {
              const sData = await sRes.json()
              if (sData.mode === 'session') {
                const config: SessionConfig = {
                  watchId: sData.watchId,
                  sessionToken: sData.sessionToken,
                  facilityName: sData.facilityName,
                  location: sData.location,
                  assignedName: sData.assignedName,
                  interval: sData.interval,
                  startTime: sData.startTime,
                  plannedEndTime: sData.plannedEndTime,
                  watchLatitude: sData.watchLatitude,
                  watchLongitude: sData.watchLongitude,
                  watchRadiusM: sData.watchRadiusM,
                  escalationPhone: sData.escalationPhone,
                  postWorkDurationMin: sData.postWorkDurationMin,
                  workStoppedAt: sData.workStoppedAt,
                  lastCompletedAt: sData.lastCompletedAt,
                  serverClockOffset: new Date(sData.serverTime).getTime() - Date.now(),
                }
                await cacheWatchConfig({
                  ...config,
                  serverTime: sData.serverTime,
                  checklistCompletedAt: sData.checklistCompletedAt,
                  cachedAt: new Date().toISOString(),
                }).catch(() => {})
                initSession(config)
                return
              }
            }
          }

          // If legacy response has a sessionToken, upgrade to session mode
          if (data.sessionToken) {
            const config: SessionConfig = {
              watchId: data.watchId,
              sessionToken: data.sessionToken,
              facilityName: data.facilityName,
              location: data.location,
              assignedName: data.assignedName,
              interval: data.interval,
              startTime: data.scheduledTime,
              plannedEndTime: null,
              watchLatitude: data.watchLatitude,
              watchLongitude: data.watchLongitude,
              watchRadiusM: data.watchRadiusM,
              escalationPhone: data.escalationPhone,
              postWorkDurationMin: data.postWorkDurationMin ?? 0,
              workStoppedAt: data.workStoppedAt,
              lastCompletedAt: null,
              serverClockOffset: 0,
            }
            initSession(config)
            return
          }

          // Pure legacy mode (no session token on watch)
          setPostWorkMin(data.postWorkDurationMin ?? 0)
          setWorkStopped(!!data.workStoppedAt)
          gateGps({
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
          return
        }
      } catch {
        // Network error — try loading from cache
        try {
          const cached = await getCachedWatchConfig(token)
          if (cached) {
            const config: SessionConfig = {
              watchId: cached.watchId,
              sessionToken: cached.sessionToken,
              facilityName: cached.facilityName,
              location: cached.location,
              assignedName: cached.assignedName,
              interval: cached.interval,
              startTime: cached.startTime,
              plannedEndTime: cached.plannedEndTime,
              watchLatitude: cached.watchLatitude,
              watchLongitude: cached.watchLongitude,
              watchRadiusM: cached.watchRadiusM,
              escalationPhone: cached.escalationPhone,
              postWorkDurationMin: cached.postWorkDurationMin,
              workStoppedAt: cached.workStoppedAt,
              lastCompletedAt: cached.lastCompletedAt,
              serverClockOffset: new Date(cached.serverTime).getTime() - new Date(cached.cachedAt).getTime(),
            }
            initSession(config)
            return
          }
        } catch {}
        setState({ phase: 'error', message: 'No internet connection. Please connect and try again.' })
      }
    }
    validate()
  }, [token, initSession])

  // Auto-transition from confirmed to watching after 2 seconds
  useEffect(() => {
    if (state.phase !== 'confirmed') return
    const timer = setTimeout(() => {
      const info = watchMetaRef.current
      if (!info) return
      // Session mode: always has nextCheckIn, no nextToken needed
      if (state.nextCheckIn) {
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
      // Re-acquire GPS on return (watchPosition handles this, but force a fresh read)
      getLocation().then(loc => {
        if (loc) setUserLocation({ latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy })
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

  async function handleStopWork() {
    if (stoppingWork || workStopped) return
    setStoppingWork(true)
    try {
      const res = await fetch('/api/checkin/stop-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to stop work')
      setWorkStopped(true)
    } catch (err) {
      console.error('Stop work error:', err)
    } finally {
      setStoppingWork(false)
    }
  }

  const handleCheckIn = useCallback(async (overrideToken?: string) => {
    if (submittingRef.current) return
    // Debounce: ignore taps within 2 seconds of last submit
    const now = Date.now()
    if (now - lastSubmitTime.current < 2000) return
    lastSubmitTime.current = now
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
    // Use already-tracked location from watchPosition (faster than one-shot getLocation)
    // Fall back to getLocation() if watchPosition hasn't fired yet
    const location = userLocation ?? await getLocation()
    if (location && !userLocation) setUserLocation(location)
    const trimmedNotes = notes.trim() || null

    // ═══════════════════════════════════════════════════════════
    // SESSION MODE: queue locally, transition immediately
    // ═══════════════════════════════════════════════════════════
    if (isSessionMode && sessionRef.current) {
      const config = sessionRef.current
      // Determine scheduled_time for this check-in
      const scheduledTime = currentState.phase === 'ready'
        ? currentState.scheduledTime
        : currentState.phase === 'due' || currentState.phase === 'grace'
          ? currentState.scheduledTime
          : computeNextScheduledTime(config).toISOString()

      // Queue locally — no server round-trip needed
      try {
        await queueCheckin({
          token: '', // not used in session mode
          session_token: config.sessionToken,
          scheduled_time: scheduledTime,
          device_time: deviceTime,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          gps_accuracy: location?.accuracy ?? null,
          notes: trimmedNotes,
        })
        // Only advance schedule after queue succeeds
        config.lastCompletedAt = scheduledTime
      } catch (idbErr) {
        // IDB failed — try server directly instead of silently losing the check-in
        console.error('IndexedDB write failed, falling back to server:', idbErr)
        try {
          const res = await fetch('/api/checkin/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_token: config.sessionToken,
              check_ins: [{
                device_time: deviceTime,
                scheduled_time: scheduledTime,
                latitude: location?.latitude ?? null,
                longitude: location?.longitude ?? null,
                gps_accuracy: location?.accuracy ?? null,
                notes: trimmedNotes,
              }],
            }),
          })
          if (res.ok) {
            config.lastCompletedAt = scheduledTime
          } else {
            // Server also failed — show error so worker knows
            setState({ phase: 'error', message: 'Check-in could not be saved. Please try again.' })
            submittingRef.current = false
            return
          }
        } catch {
          setState({ phase: 'error', message: 'No connection and local storage full. Please try again.' })
          submittingRef.current = false
          return
        }
      }
      setLocalCheckInCount(c => c + 1)

      // Clear notes
      setNotes('')
      setShowNotes(false)

      // Compute next check-in time
      const nextScheduled = addMinutes(new Date(scheduledTime), config.interval)

      // Show confirmed briefly, then transition to watching
      setState({
        phase: 'confirmed',
        nextCheckIn: nextScheduled.toISOString(),
        serverTime: deviceTime, // use device time since we're offline-first
        gpsCapture: location !== null,
        facilityName,
        assignedName,
        nextToken: undefined,
      })

      // Background sync attempt (non-blocking)
      syncPendingCheckins().then(result => {
        if (result.synced > 0 || result.reconciled > 0) {
          setSyncToast(`${result.synced + result.reconciled} check-in(s) synced`)
          setTimeout(() => setSyncToast(null), 4000)
        }
        getPendingCount().then(setPendingCount).catch(() => {})
      }).catch(() => {})

      submittingRef.current = false
      return
    }

    // ═══════════════════════════════════════════════════════════
    // LEGACY MODE: server round-trip required
    // ═══════════════════════════════════════════════════════════
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
          notes: trimmedNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 410 || res.status === 404) {
          setState({ phase: 'expired', message: data.error ?? 'This check-in window has expired.' })
        } else if (res.status === 409) {
          setState({ phase: 'expired', message: data.error ?? 'This check-in has already been recorded.' })
        } else {
          setState({ phase: 'error', message: data.error ?? 'Check-in failed. Please try again.' })
        }
        submittingRef.current = false
        return
      }
      if (data.offline) {
        setState({ phase: 'queued', deviceTime, gpsCapture: location !== null })
        submittingRef.current = false
        return
      }

      if (data.facilityName && watchMetaRef.current) {
        watchMetaRef.current.facilityName = data.facilityName || facilityName
        watchMetaRef.current.assignedName = data.assignedName || assignedName
        if (data.watchLatitude != null) watchMetaRef.current.watchLatitude = data.watchLatitude
        if (data.watchLongitude != null) watchMetaRef.current.watchLongitude = data.watchLongitude
        if (data.watchRadiusM != null) watchMetaRef.current.watchRadiusM = data.watchRadiusM
        if (data.escalationPhone !== undefined) watchMetaRef.current.escalationPhone = data.escalationPhone
      }

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
  }, [token, state, notes, isSessionMode])

  // ===== RENDER =====

  // ═══════════════════════════════════════════════════════════
  // GPS PERMISSION GATE
  // ═══════════════════════════════════════════════════════════
  if (state.phase === 'gps_prompt') {
    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent)
    const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)

    const requestGps = () => {
      setGpsPermission('checking')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          })
          setGpsPermission('granted')
          setState({ phase: 'loading' })
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) setGpsPermission('denied')
          else setGpsPermission('unavailable')
        },
        { enableHighAccuracy: true, timeout: 15000 }
      )
    }

    const skipGps = () => {
      setGpsPermission('dismissed')
      setState({ phase: 'loading' })
    }

    // ─── DENIED STATE ───
    if (gpsPermission === 'denied') {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
          <Logo />
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full overflow-hidden">
            {/* Header */}
            <div className="bg-amber-600 px-6 py-5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="text-lg text-white font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
                Location is Blocked
              </h1>
              <p className="text-amber-100 text-sm mt-1">
                Your browser blocked GPS. You have two options:
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Option 1: Continue without GPS — big, prominent, green */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">Recommended</span>
                </div>
                <h3 className="text-white font-bold text-sm mb-1">Continue without GPS</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">
                  Your check-ins will still be recorded with timestamps. GPS coordinates will be blank on the report.
                </p>
                <button
                  onClick={skipGps}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all active:scale-[0.98]"
                >
                  Start Checking In &rarr;
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs font-medium">or</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              {/* Option 2: Fix it — step-by-step */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-bold text-sm mb-1">Enable GPS for full compliance</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">
                  GPS adds coordinates to every check-in for OSHA documentation.
                </p>

                {isIOS ? (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-blue-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Open iPhone Settings</p>
                        <p className="text-slate-500 text-[11px]">The gray gear icon on your home screen</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-blue-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Scroll down, tap Safari</p>
                        <p className="text-slate-500 text-[11px]">Or whichever browser you&apos;re using (Chrome, etc.)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-blue-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Tap Location &rarr; set to &ldquo;Allow&rdquo;</p>
                        <p className="text-slate-500 text-[11px]">Under &ldquo;Settings for Websites&rdquo; section</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-green-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Come back and tap the button below</p>
                      </div>
                    </div>
                  </div>
                ) : isAndroid ? (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-blue-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Tap the lock icon in the address bar</p>
                        <p className="text-slate-500 text-[11px]">It&apos;s at the top of your screen, left of the URL</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-blue-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Tap &ldquo;Permissions&rdquo;</p>
                        <p className="text-slate-500 text-[11px]">Or &ldquo;Site settings&rdquo; depending on your browser</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-blue-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Turn on Location</p>
                        <p className="text-slate-500 text-[11px]">Toggle the switch or select &ldquo;Allow&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-green-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Come back and tap the button below</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-blue-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Open your browser&apos;s site settings</p>
                        <p className="text-slate-500 text-[11px]">Usually the lock or info icon in the address bar</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-blue-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Set Location to &ldquo;Allow&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900 rounded-lg p-3">
                      <span className="bg-green-600 text-white rounded-md w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                      <div>
                        <p className="text-white text-xs font-semibold">Come back and tap the button below</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={requestGps}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all active:scale-[0.98]"
                >
                  I Fixed It &mdash; Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // ─── UNAVAILABLE STATE ───
    if (gpsPermission === 'unavailable') {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
          <Logo />
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-amber-700 px-6 py-5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <line x1="10" y1="8" x2="14" y2="12" />
                  <line x1="14" y1="8" x2="10" y2="12" />
                </svg>
              </div>
              <h1 className="text-lg text-white font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
                GPS Not Available
              </h1>
              <p className="text-amber-100 text-sm mt-1">
                This device can&apos;t provide GPS data right now.
              </p>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-slate-400 text-sm leading-relaxed">
                This usually means location services are turned off in your device settings, or the device doesn&apos;t have GPS hardware.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                You can still check in &mdash; everything is recorded with timestamps. GPS coordinates will be blank on the compliance report.
              </p>
              <button
                onClick={skipGps}
                className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all active:scale-[0.98] mt-2"
              >
                Start Checking In &rarr;
              </button>
              <button
                onClick={requestGps}
                className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    // ─── DEFAULT / CHECKING STATE ───
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-900/50 border-2 border-blue-700 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h1 className="text-xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Enable Location
          </h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            GPS coordinates are recorded with every check-in for OSHA compliance documentation.
          </p>

          {gpsPermission === 'checking' ? (
            <div className="flex flex-col items-center gap-3 py-4 mb-4">
              <div className="w-8 h-8 border-3 border-blue-800 border-t-blue-400 rounded-full animate-spin" />
              <div>
                <span className="text-blue-400 text-sm font-semibold block">Waiting for permission&hellip;</span>
                <span className="text-slate-500 text-xs block mt-1">Tap &ldquo;Allow&rdquo; on the popup from your browser</span>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={requestGps}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all active:scale-[0.98] mb-3"
              >
                Allow Location Access
              </button>
              <p className="text-slate-600 text-[11px] mb-4 leading-relaxed">
                Your browser will show a popup &mdash; tap <strong className="text-slate-400">&ldquo;Allow&rdquo;</strong> to enable GPS.
              </p>
            </>
          )}

          <button
            onClick={skipGps}
            className="w-full py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-400 hover:text-slate-300 text-xs font-medium transition-all"
          >
            Skip &mdash; continue without GPS
          </button>
        </div>
      </div>
    )
  }

  if (state.phase === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
        <Logo />
        <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (state.phase === 'watch_complete') {
    const pct = state.totalCheckIns > 0 ? Math.round((state.completedCheckIns / state.totalCheckIns) * 100) : 100
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
            Watch Complete
          </h1>
          <p className="text-green-300 text-sm mb-6">
            This fire watch has been closed out by your supervisor. You are relieved.
          </p>

          {/* Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">Job Site</span>
              <span className="text-white text-sm font-semibold">{state.facilityName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">Fire Watch</span>
              <span className="text-white text-sm font-semibold">{state.assignedName}</span>
            </div>
            {state.endedAt && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Ended</span>
                <span className="text-white text-sm font-semibold">{format(new Date(state.endedAt), 'MMM d, h:mm a')}</span>
              </div>
            )}
            <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
              <span className="text-slate-400 text-xs">Check-Ins</span>
              <span className="text-white text-sm font-semibold">{state.completedCheckIns}/{state.totalCheckIns} ({pct}%)</span>
            </div>
            {state.missedCheckIns > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Missed</span>
                <span className="text-red-400 text-sm font-semibold">{state.missedCheckIns}</span>
              </div>
            )}
          </div>

          <p className="text-slate-500 text-xs">
            You may close this page. Thank you for your service.
          </p>
        </div>
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
          <p className="text-amber-300 text-sm mb-3">{state.message}</p>
          <p className="text-slate-400 text-xs mb-5 leading-relaxed">
            You need to complete the pre-watch safety checklist before you can check in. This ensures all safety protocols are in place.
          </p>
          {state.checklistToken && (
            <a
              href={`/checklist/${state.checklistToken}`}
              className="block w-full py-3.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.97] mb-3"
            >
              Open Safety Checklist
            </a>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
          >
            I Already Completed It
          </button>
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

  // GPS overlay banner for all active phases
  const gpsOverlay = (gpsPermission === 'denied' || gpsPermission === 'unavailable' || gpsPermission === 'dismissed') ? (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-2">
      <GpsWarningBanner status={gpsPermission} accuracy={userLocation?.accuracy ?? null} />
    </div>
  ) : null

  // GPS accuracy pill for views that need it
  const gpsPill = <GpsAccuracyPill accuracy={userLocation?.accuracy ?? null} />

  if (state.phase === 'watching') {
    return (
      <>
        {gpsOverlay}
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
          postWorkMin={postWorkMin}
          workStopped={workStopped}
          workStoppedAt={sessionRef.current?.workStoppedAt ?? null}
          stoppingWork={stoppingWork}
          onStopWork={handleStopWork}
          gpsPill={gpsPill}
          plannedEndTime={sessionRef.current?.plannedEndTime ?? null}
        />
      </>
    )
  }

  if (state.phase === 'due') {
    return (
      <>
        {gpsOverlay}
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
          gpsPill={gpsPill}
        />
      </>
    )
  }

  if (state.phase === 'grace') {
    return (
      <>
        {gpsOverlay}
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
          gpsPill={gpsPill}
        />
      </>
    )
  }

  if (state.phase === 'missed_waiting') {
    // In session mode, auto-advance to next check-in after 5 seconds
    if (isSessionMode && sessionRef.current) {
      const config = sessionRef.current
      const nextScheduled = computeNextScheduledTime(config)
      setTimeout(() => {
        setState({
          phase: 'watching',
          facilityName: config.facilityName,
          assignedName: config.assignedName,
          nextCheckInTime: nextScheduled.toISOString(),
          lastCheckInTime: new Date().toISOString(),
        })
      }, 5000)
    }

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
            {isSessionMode ? 'Advancing to next check-in...' : 'Your next check-in link will arrive shortly.'}
          </p>
        </div>
      </div>
    )
  }

  // phase === 'ready'
  const { facilityName, assignedName, scheduledTime } = state

  return (
    <>
      {gpsOverlay}
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
        gpsPill={gpsPill}
      />
    </>
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
  postWorkMin,
  workStopped,
  workStoppedAt,
  stoppingWork,
  onStopWork,
  gpsPill,
  plannedEndTime,
}: {
  facilityName: string
  assignedName: string
  nextCheckInTime: string
  lastCheckInTime: string
  watchMeta: WatchMeta | null
  userLocation: { latitude: number; longitude: number; accuracy: number } | null
  online: boolean
  syncToast: string | null
  pendingCount: number
  postWorkMin: number
  workStopped: boolean
  workStoppedAt: string | null
  stoppingWork: boolean
  onStopWork: () => void
  gpsPill?: React.ReactNode
  plannedEndTime: string | null
}) {
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(0, Math.floor((new Date(nextCheckInTime).getTime() - Date.now()) / 1000))
  })
  const [postWorkSecondsLeft, setPostWorkSecondsLeft] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(nextCheckInTime).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }, 1000)
    return () => clearInterval(interval)
  }, [nextCheckInTime])

  // Post-work countdown for the watcher
  useEffect(() => {
    if (!workStopped || !workStoppedAt || !postWorkMin) return
    const calcRemaining = () => {
      const postWorkEnd = new Date(workStoppedAt).getTime() + postWorkMin * 60 * 1000
      return Math.max(0, Math.ceil((postWorkEnd - Date.now()) / 1000))
    }
    setPostWorkSecondsLeft(calcRemaining())
    const iv = setInterval(() => setPostWorkSecondsLeft(calcRemaining()), 1000)
    return () => clearInterval(iv)
  }, [workStopped, workStoppedAt, postWorkMin])

  const postWorkComplete = workStopped && postWorkSecondsLeft === 0

  const totalInterval = Math.max(1, Math.floor((new Date(nextCheckInTime).getTime() - new Date(lastCheckInTime).getTime()) / 1000))
  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / totalInterval))
  // Approaching = less than 2 minutes left
  const approaching = secondsLeft > 0 && secondsLeft <= 120
  const progressColor = approaching ? 'bg-amber-500' : workStopped ? 'bg-blue-500' : 'bg-green-500'

  // Circular progress for the timer
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
      <style>{`
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .timer-pulse { animation: subtlePulse 2s ease-in-out infinite; }
      `}</style>
      <div className="w-full max-w-sm">
        <Logo />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Watch info header */}
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-white text-xl mb-0.5"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                >
                  {facilityName}
                </h1>
                <p className="text-slate-400 text-sm">{assignedName}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${workStopped ? 'bg-blue-950 border border-blue-800' : approaching ? 'bg-amber-950 border border-amber-800' : 'bg-green-950 border border-green-800'}`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${workStopped ? 'bg-blue-400' : approaching ? 'bg-amber-400' : 'bg-green-400'}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${workStopped ? 'bg-blue-500' : approaching ? 'bg-amber-500' : 'bg-green-500'}`} />
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${workStopped ? 'text-blue-400' : approaching ? 'text-amber-400' : 'text-green-400'}`}>
                  {workStopped ? 'Cooldown' : approaching ? 'Soon' : 'Active'}
                </span>
              </div>
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

          {/* Circular countdown */}
          <div className="px-6 py-8 flex flex-col items-center">
            <div className="relative w-52 h-52 mb-4">
              {/* Background circle */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="#1e293b" strokeWidth="6" />
                <circle
                  cx="100" cy="100" r={radius} fill="none"
                  stroke={approaching ? '#f59e0b' : workStopped ? '#3b82f6' : '#22c55e'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              {/* Timer text in center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${approaching ? 'text-amber-400' : 'text-slate-500'}`}>
                  {approaching ? 'Get Ready' : 'Next Check-In'}
                </p>
                <p
                  className={`text-5xl font-black tracking-tight ${approaching ? 'text-amber-400 timer-pulse' : 'text-white'}`}
                  style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatCountdown(secondsLeft)}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {format(new Date(nextCheckInTime), 'h:mm a')}
                </p>
              </div>
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

          {/* Stop Work / Post-Work Cooldown */}
          {postWorkMin > 0 && !workStopped && (
            <div className="mx-6 mb-3">
              {!showStopConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowStopConfirm(true)}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-orange-950/80 border border-orange-800/60 text-orange-400 hover:bg-orange-900 text-sm font-semibold transition-all active:scale-[0.97]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                  Hot Work Complete
                </button>
              ) : (
                <div className="bg-orange-950 border border-orange-700 rounded-xl p-4 space-y-3">
                  <p className="text-orange-300 text-sm font-semibold text-center">End hot work early?</p>
                  <p className="text-orange-400/80 text-xs text-center leading-relaxed">
                    This will start the {postWorkMin}-minute post-work monitoring period. Your supervisor will be notified.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => { onStopWork(); setShowStopConfirm(false) }}
                      disabled={stoppingWork}
                      className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white text-sm font-bold transition-colors active:scale-[0.97]"
                    >
                      {stoppingWork ? 'Stopping...' : 'Confirm Stop'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStopConfirm(false)}
                      className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors active:scale-[0.97]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {workStopped && postWorkMin > 0 && (
            <div className={`mx-6 mb-3 px-4 py-3 rounded-xl border ${postWorkComplete ? 'bg-green-950/80 border-green-800/60' : 'bg-blue-950/80 border-blue-800/60'}`}>
              <div className="flex items-center justify-center gap-2.5">
                {postWorkComplete ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                    <span className="text-green-400 text-xs font-semibold">Post-work monitoring complete</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-blue-400 text-xs font-semibold">
                      Post-work cooldown — {Math.floor(postWorkSecondsLeft / 60)}:{String(postWorkSecondsLeft % 60).padStart(2, '0')} remaining
                    </span>
                  </>
                )}
              </div>
              {postWorkComplete && (
                <p className="text-green-400/70 text-[10px] text-center mt-1.5">
                  Cooldown period is done. Wait for your supervisor to close out the watch.
                </p>
              )}
            </div>
          )}

          {/* Planned end time */}
          {plannedEndTime && !workStopped && (
            <div className="mx-6 mb-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-slate-400 text-xs font-semibold">
                Watch ends at {format(new Date(plannedEndTime), 'h:mm a')}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 space-y-2.5">
            {watchMeta?.escalationPhone && (
              <CallSupervisorButton phone={watchMeta.escalationPhone} />
            )}
            <p className="text-slate-600 text-[11px] text-center leading-relaxed">
              {online
                ? 'Keep this page open. You\u2019ll be alerted when it\u2019s time.'
                : 'Offline — check-ins will sync when connection returns.'}
            </p>
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
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
  gpsPill,
}: {
  facilityName: string
  assignedName: string
  scheduledTime: string
  onCheckIn: () => void
  watchMeta: WatchMeta | null
  userLocation: { latitude: number; longitude: number; accuracy: number } | null
  notes: string
  onNotesChange: (v: string) => void
  showNotes: boolean
  onToggleNotes: () => void
  gpsPill?: React.ReactNode
}) {
  const [tapped, setTapped] = useState(false)
  const [online, setOnline] = useState(true)
  const [now, setNow] = useState(Date.now())

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

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const overdueSec = Math.max(0, Math.floor((now - new Date(scheduledTime).getTime()) / 1000))
  const overdueMin = Math.floor(overdueSec / 60)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
      <style>{`
        @keyframes buttonGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.1); }
          50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.5), 0 0 80px rgba(34, 197, 94, 0.2); }
        }
        .button-glow { animation: buttonGlow 2s ease-in-out infinite; }
      `}</style>
      <div className="w-full max-w-sm">
        <Logo />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Header with urgency */}
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Check-In Due</span>
              </div>
              {overdueMin > 0 && (
                <span className="text-[10px] text-red-400 font-bold bg-red-950 border border-red-800/60 px-2 py-1 rounded-full">
                  {overdueMin} min overdue
                </span>
              )}
            </div>
            <h1
              className="text-white text-xl mb-0.5"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              {facilityName}
            </h1>
            <p className="text-slate-400 text-sm">{assignedName}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-slate-500 text-sm">
                Due at <span className="text-white font-bold">{format(new Date(scheduledTime), 'h:mm a')}</span>
              </p>
              {gpsPill}
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
            <div className="mx-6 mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-950 border border-red-800">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400 text-xs font-semibold">Offline — check-in will be queued</span>
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
              className={`w-full py-7 text-white text-2xl font-black rounded-2xl transition-all select-none touch-manipulation active:scale-[0.96] disabled:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300 ${
                tapped
                  ? 'bg-green-800 text-green-300'
                  : 'bg-green-500 hover:bg-green-400 active:bg-green-600 button-glow'
              }`}
            >
              {tapped ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
                  Recording...
                </span>
              ) : 'CHECK IN NOW'}
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-4 space-y-2.5">
            {watchMeta?.escalationPhone && (
              <CallSupervisorButton phone={watchMeta.escalationPhone} />
            )}
          </div>
        </div>
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
  gpsPill,
}: {
  facilityName: string
  assignedName: string
  scheduledTime: string
  onCheckIn: () => void
  watchMeta: WatchMeta | null
  userLocation: { latitude: number; longitude: number; accuracy: number } | null
  notes: string
  onNotesChange: (v: string) => void
  showNotes: boolean
  onToggleNotes: () => void
  gpsPill?: React.ReactNode
}) {
  const [tapped, setTapped] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const overdueSec = Math.max(0, Math.floor((now - new Date(scheduledTime).getTime()) / 1000))
  const overdueMin = Math.floor(overdueSec / 60)
  const overdueSecs = overdueSec % 60

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-red-950">
      <style>{`
        @keyframes urgentPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.4), 0 0 80px rgba(239, 68, 68, 0.15); }
          50% { box-shadow: 0 0 50px rgba(239, 68, 68, 0.7), 0 0 120px rgba(239, 68, 68, 0.3); }
        }
        @keyframes borderFlash {
          0%, 100% { border-color: rgba(239, 68, 68, 0.6); }
          50% { border-color: rgba(248, 113, 113, 0.9); }
        }
        .urgent-glow { animation: urgentPulse 1.5s ease-in-out infinite; }
        .border-flash { animation: borderFlash 1.5s ease-in-out infinite; }
      `}</style>
      <div className="w-full max-w-sm">
        <Logo />

        <div className="border-2 rounded-2xl overflow-hidden bg-red-950/80 border-flash">
          {/* Header */}
          <div className="px-6 py-5 border-b border-red-800/60 bg-red-900/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Overdue</span>
              </div>
              <span className="text-[10px] text-red-300 font-bold bg-red-900 border border-red-700/60 px-2 py-1 rounded-full">
                Was due {format(new Date(scheduledTime), 'h:mm a')}
              </span>
            </div>
            <h1
              className="text-white text-xl mb-0.5"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              {facilityName}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-red-300/80 text-sm">{assignedName}</p>
              {gpsPill}
            </div>
          </div>

          {/* Overdue counter */}
          <div className="px-6 py-6 text-center">
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-2">Overdue By</p>
            <p
              className="text-red-300 text-4xl sm:text-5xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}
            >
              {String(overdueMin).padStart(2, '0')}:{String(overdueSecs).padStart(2, '0')}
            </p>
            <p className="text-red-400/60 text-xs mt-2">
              Your supervisor will be notified if not checked in soon
            </p>
          </div>

          {/* Geofence status */}
          {watchMeta?.watchLatitude != null && (
            <div className="px-6 pb-3">
              <GeofenceBadge
                userLat={userLocation?.latitude ?? null}
                userLng={userLocation?.longitude ?? null}
                watchLat={watchMeta.watchLatitude}
                watchLng={watchMeta.watchLongitude}
                radius={watchMeta.watchRadiusM}
              />
            </div>
          )}

          {/* Notes input */}
          <div className="px-6 pb-2">
            <NotesInput notes={notes} onChange={onNotesChange} show={showNotes} onToggle={onToggleNotes} />
          </div>

          {/* The button */}
          <div className="p-6 pt-2">
            <button
              onClick={() => { setTapped(true); onCheckIn() }}
              disabled={tapped}
              aria-label={`Check in now - overdue at ${facilityName}`}
              className={`w-full py-7 text-white text-2xl font-black rounded-2xl transition-all select-none touch-manipulation active:scale-[0.96] disabled:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 ${
                tapped
                  ? 'bg-red-900 text-red-400'
                  : 'bg-red-600 hover:bg-red-500 active:bg-red-700 urgent-glow'
              }`}
            >
              {tapped ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                  Recording...
                </span>
              ) : 'CHECK IN NOW'}
            </button>
          </div>

          {/* Supervisor contact */}
          {watchMeta?.escalationPhone && (
            <div className="px-6 pb-4">
              <CallSupervisorButton phone={watchMeta.escalationPhone} />
            </div>
          )}
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
  watchMeta,
  userLocation,
  notes,
  onNotesChange,
  showNotes,
  onToggleNotes,
  gpsPill,
}: {
  facilityName: string
  assignedName: string
  scheduledTime: string
  onCheckIn: () => void
  watchMeta: WatchMeta | null
  userLocation: { latitude: number; longitude: number; accuracy: number } | null
  notes: string
  onNotesChange: (v: string) => void
  showNotes: boolean
  onToggleNotes: () => void
  gpsPill?: React.ReactNode
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
  const isOverdue = diffSec > 60
  const isDueNow = diffSec >= -60 && diffSec <= 60
  const timeContext =
    diffSec < -60 ? `in ${diffMin + 1} min` :
    diffSec <= 60  ? 'now' :
    diffMin === 1  ? '1 min ago' :
                     `${diffMin} min ago`

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
      <style>{`
        @keyframes readyGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.1); }
          50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.5), 0 0 80px rgba(34, 197, 94, 0.2); }
        }
        .ready-glow { animation: readyGlow 2s ease-in-out infinite; }
      `}</style>
      <div className="w-full max-w-sm">
        <Logo />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Info header */}
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fire Watch Check-In</p>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                isOverdue ? 'bg-red-950 border border-red-800/60 text-red-400' :
                isDueNow ? 'bg-amber-950 border border-amber-800/60 text-amber-400' :
                'bg-green-950 border border-green-800/60 text-green-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-red-500' : isDueNow ? 'bg-amber-500' : 'bg-green-500'}`} />
                Due {timeContext}
              </div>
            </div>
            <h1
              className="text-white text-xl mb-0.5"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              {facilityName}
            </h1>
            <p className="text-slate-400 text-sm">{assignedName}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-slate-500 text-sm">
                Scheduled: <span className="text-white font-bold">{format(new Date(scheduledTime), 'h:mm a')}</span>
              </p>
              {gpsPill}
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
            <div className="mx-6 mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-950 border border-red-800">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400 text-xs font-semibold">Offline — check-in will be queued</span>
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
              className={`w-full py-7 text-white text-2xl font-black rounded-2xl transition-all select-none touch-manipulation active:scale-[0.96] disabled:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300 ${
                tapped
                  ? 'bg-green-800 text-green-300'
                  : 'bg-green-500 hover:bg-green-400 active:bg-green-600 ready-glow'
              }`}
            >
              {tapped ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
                  Recording...
                </span>
              ) : 'CHECK IN NOW'}
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-4 space-y-2.5">
            {watchMeta?.escalationPhone && (
              <CallSupervisorButton phone={watchMeta.escalationPhone} />
            )}
            <p className="text-slate-600 text-[11px] text-center leading-relaxed">
              GPS location is captured automatically with each check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
