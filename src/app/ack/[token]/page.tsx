'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'

type AckState =
  | { phase: 'loading' }
  | { phase: 'invalid'; message: string }
  | { phase: 'already_acknowledged' }
  | { phase: 'ready'; facilityName: string; assignedName: string; scheduledTime: string; escalationSentAt: string; watchStatus: string }
  | { phase: 'submitting' }
  | { phase: 'confirmed'; serverTime: string; gpsCapture: boolean }
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

export default function AckPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<AckState>({ phase: 'loading' })
  const submittingRef = useRef(false)

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/ack/validate?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 410 && data.error === 'already_acknowledged') {
            setState({ phase: 'already_acknowledged' })
          } else {
            setState({ phase: 'invalid', message: data.error ?? data.message ?? 'Invalid acknowledgment link.' })
          }
          return
        }
        setState({
          phase: 'ready',
          facilityName: data.facilityName,
          assignedName: data.assignedName,
          scheduledTime: data.scheduledTime,
          escalationSentAt: data.escalationSentAt,
          watchStatus: data.watchStatus,
        })
      } catch {
        setState({ phase: 'error', message: 'Network error. Please try again.' })
      }
    }
    validate()
  }, [token])

  async function handleAcknowledge() {
    if (submittingRef.current) return
    submittingRef.current = true
    setState({ phase: 'submitting' })
    const location = await getLocation()

    try {
      const res = await fetch('/api/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          gps_accuracy: location?.accuracy ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setState({ phase: 'already_acknowledged' })
        } else {
          setState({ phase: 'error', message: data.error ?? 'Failed to acknowledge. Please try again.' })
        }
        return
      }
      setState({
        phase: 'confirmed',
        serverTime: data.serverTime,
        gpsCapture: location !== null,
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
        <div className="w-8 h-8 border-3 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (state.phase === 'already_acknowledged') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <Logo />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-slate-400 text-2xl font-bold">✓</span>
          </div>
          <h1
            className="text-2xl text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Already Acknowledged
          </h1>
          <p className="text-slate-400 text-sm">
            This alert was previously acknowledged. No further action needed.
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
            className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl text-sm transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
            <span className="text-green-400 text-3xl font-bold">✓</span>
          </div>
          <h1
            className="text-2xl text-white mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Alert Acknowledged
          </h1>
          <p className="text-green-300 text-sm mb-6">
            Your acknowledgment has been recorded and timestamped.
          </p>
          <div className="bg-green-900 rounded-xl px-6 py-4 mb-5">
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1">Server Timestamp</p>
            <p className="text-white text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {format(new Date(state.serverTime), 'h:mm:ss a')}
            </p>
            <p className="text-green-400 text-xs mt-1">
              {format(new Date(state.serverTime), 'EEEE, MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {state.gpsCapture ? (
              <span className="text-[10px] text-green-500 font-semibold">📍 Location recorded</span>
            ) : (
              <span className="text-[10px] text-slate-500">Location not captured — GPS unavailable</span>
            )}
          </div>
          <p className="text-slate-500 text-xs">
            This acknowledgment has been logged in the compliance report.
          </p>
        </div>
      </div>
    )
  }

  if (state.phase === 'submitting') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center" role="status" aria-label="Recording acknowledgment">
        <Logo />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full">
          <div className="w-10 h-10 mx-auto mb-4 border-3 border-slate-700 border-t-amber-500 rounded-full animate-spin" aria-hidden="true" />
          <h1
            className="text-xl text-white mb-1"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Recording acknowledgment…
          </h1>
          <p className="text-slate-500 text-xs">Logging your response. Do not close.</p>
        </div>
      </div>
    )
  }

  // phase === 'ready'
  const { facilityName, assignedName, scheduledTime, escalationSentAt, watchStatus } = state

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Logo />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-4">
          {/* Alert banner */}
          <div className="bg-red-950 border-b border-red-800 px-6 py-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-[10px] font-bold tracking-widest uppercase">Missed Check-In Alert</span>
            </div>
            <p className="text-red-300 text-xs">
              A fire watch check-in was missed. Tap below to acknowledge.
            </p>
          </div>

          {/* Details */}
          <div className="px-6 py-5 border-b border-slate-800">
            <h1
              className="text-white text-xl mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              {facilityName}
            </h1>
            <p className="text-slate-400 text-sm mb-3">{assignedName}</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Scheduled</span>
                <span className="text-white font-bold">{format(new Date(scheduledTime), 'h:mm a')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Alert fired</span>
                <span className="text-red-400 font-medium">{format(new Date(escalationSentAt), 'h:mm:ss a')}</span>
              </div>
              {watchStatus === 'completed' && (
                <div className="text-amber-500 text-xs mt-2">
                  Note: This watch has since ended, but acknowledgment is still available.
                </div>
              )}
            </div>
          </div>

          {/* The big button */}
          <div className="p-6">
            <button
              onClick={handleAcknowledge}
              aria-label={`Acknowledge missed check-in alert for ${facilityName}`}
              className="w-full py-8 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white text-2xl font-black rounded-2xl shadow-2xl shadow-amber-900/50 transition-all select-none touch-manipulation active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            >
              ACKNOWLEDGE ALERT
            </button>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center max-w-xs mx-auto leading-relaxed">
          Tap the button to confirm you are aware and responding.
          GPS is captured if your browser allows it. This acknowledgment is logged in the compliance report.
        </p>
      </div>
    </div>
  )
}
