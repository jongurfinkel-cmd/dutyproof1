'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────
// Timing
// ─────────────────────────────────────────────────────────
const TYPE_SPEED = 30
const FIELD_GAP  = 180

// ─────────────────────────────────────────────────────────
// Typed text hook
// ─────────────────────────────────────────────────────────
function useTypedText(text: string, active: boolean, speed = TYPE_SPEED) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!active) { setDisplayed(''); return }
    let i = 0
    setDisplayed('')
    const iv = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(iv)
    }, speed)
    return () => clearInterval(iv)
  }, [active, text, speed])
  return displayed
}

// ─────────────────────────────────────────────────────────
// Animated cursor
// ─────────────────────────────────────────────────────────
function Cursor({ x, y, clicking, visible }: { x: string; y: string; clicking: boolean; visible: boolean }) {
  return (
    <div
      className="absolute z-50 pointer-events-none transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ left: x, top: y, opacity: visible ? 1 : 0 }}
    >
      <div className={`absolute -inset-4 rounded-full bg-blue-400/20 transition-all duration-300 ${clicking ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={`drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)] transition-transform duration-150 ${clicking ? 'scale-90' : 'scale-100'}`}>
        <path d="M5 3l14 8-6.5 1.5L11 19z" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="1" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Countdown
// ─────────────────────────────────────────────────────────
function Countdown({ from, active }: { from: number; active: boolean }) {
  const [value, setValue] = useState(from)
  useEffect(() => {
    if (!active) { setValue(from); return }
    setValue(from)
    const iv = setInterval(() => {
      setValue(v => {
        if (v <= 0) { clearInterval(iv); return 0 }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [active, from])
  return <span>{value}</span>
}

// ─────────────────────────────────────────────────────────
// Check icon
// ─────────────────────────────────────────────────────────
function Check({ size = 10, color = '#4ade80' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
}

// ─────────────────────────────────────────────────────────
// Camera icon
// ─────────────────────────────────────────────────────────
function CameraIcon({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
}

// ─────────────────────────────────────────────────────────
// Phase headlines — the sales pitch changes per phase
// ─────────────────────────────────────────────────────────
const phaseContent = [
  { label: 'Setup',     desc: 'Create a watch in 60 sec',          color: 'blue' },
  { label: 'Checklist', desc: 'Safety check with photos',          color: 'orange' },
  { label: 'Check-In',  desc: 'Worker taps to verify',             color: 'blue' },
  { label: 'Tracking',  desc: 'See every round in real time',      color: 'green' },
  { label: 'Alert',     desc: 'Missed? Super knows in 60 sec',     color: 'red' },
  { label: 'Report',    desc: 'One-click PDF for inspectors',      color: 'blue' },
]

// ─────────────────────────────────────────────────────────
// Phase stepper — compact dots
// ─────────────────────────────────────────────────────────
const phaseActiveStyles: Record<string, { bg: string; text: string; border: string; shadow: string; dot: string }> = {
  blue:   { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/40',   shadow: 'shadow-blue-500/15',   dot: '#60a5fa' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', shadow: 'shadow-orange-500/15', dot: '#fb923c' },
  green:  { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/40',  shadow: 'shadow-green-500/15',  dot: '#4ade80' },
  red:    { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/40',    shadow: 'shadow-red-500/15',    dot: '#f87171' },
}

function PhaseStepper({ phase, onJump }: { phase: number; onJump?: (phase: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5">
      {phaseContent.map((p, i) => {
        const done = i < phase
        const active = i === phase
        const s = phaseActiveStyles[p.color] ?? phaseActiveStyles.blue
        return (
          <div key={i} className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => onJump?.(i)}
              className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-full text-[8px] sm:text-[10px] font-bold transition-all duration-500 cursor-pointer hover:scale-105 ${
              active
                ? `${s.bg} ${s.text} border ${s.border} shadow-lg ${s.shadow}`
                : done
                  ? 'bg-green-500/10 text-green-500/80 border border-green-500/20 hover:bg-green-500/20'
                  : 'bg-slate-800/60 text-slate-600 border border-slate-700/30 hover:bg-slate-700/60 hover:text-slate-400'
            }`}>
              {done ? <Check size={8} color="#4ade80" /> : <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? s.dot : '#475569' }} />}
              <span className="sm:inline">{p.label}</span>
            </button>
            {i < phaseContent.length - 1 && (
              <div className={`w-2 sm:w-4 h-px transition-colors duration-500 ${i < phase ? 'bg-green-500/40' : 'bg-slate-700/50'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Main Component — unified sales pitch + demo
// ─────────────────────────────────────────────────────────
export default function InteractiveDemo() {
  const [phase, setPhase] = useState(4)
  const [step, setStep] = useState(0)
  const [cursorPos, setCursorPos] = useState({ x: '50%', y: '50%' })
  const [clicking, setClicking] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [loopCount, setLoopCount] = useState(0)
  const [countdownActive, setCountdownActive] = useState(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const jumpRef = useRef<number | null>(4)

  const facilityText = useTypedText('Harbor Steel — Welding Bay 2', phase === 0 && step >= 1, TYPE_SPEED)
  const guardText    = useTypedText('D. Kim', phase === 0 && step >= 2, TYPE_SPEED)
  const phoneText    = useTypedText('+1 (555) 012-3456', phase === 0 && step >= 3, TYPE_SPEED)

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const wait = useCallback((ms: number) => {
    return new Promise<void>(resolve => {
      timeoutsRef.current.push(setTimeout(resolve, ms))
    })
  }, [])

  const click = useCallback(async (x: string, y: string) => {
    setCursorPos({ x, y })
    await wait(550)
    setClicking(true)
    await wait(160)
    setClicking(false)
  }, [wait])

  const jumpToPhase = useCallback((target: number) => {
    clearTimeouts()
    jumpRef.current = target
    setLoopCount(c => c + 1)
  }, [clearTimeouts])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const guard = async () => { if (cancelled) throw new Error('cancelled') }

      // Check if we're jumping to a specific phase
      const startFrom = jumpRef.current ?? 0
      jumpRef.current = null

      try {
        // ═══ PHASE 0: Create Watch Form ═══
        if (startFrom <= 0) {
        setPhase(0); setStep(0); setCursorVisible(true); setCountdownActive(false)
        await wait(1200); await guard()

        setCursorPos({ x: '35%', y: '22%' })
        await wait(500); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(1)
        await wait('Harbor Steel — Welding Bay 2'.length * TYPE_SPEED + FIELD_GAP)
        await guard()

        setCursorPos({ x: '30%', y: '37%' })
        await wait(400); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(2)
        await wait('D. Kim'.length * TYPE_SPEED + FIELD_GAP)
        await guard()

        setCursorPos({ x: '70%', y: '37%' })
        await wait(400); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(3)
        await wait('+1 (555) 012-3456'.length * TYPE_SPEED + FIELD_GAP)
        await guard()

        setCursorPos({ x: '20%', y: '52%' })
        await wait(400); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(4)
        await wait(400); await guard()

        setStep(5)
        await wait(350); await guard()

        await click('50%', '72%'); await guard()
        setStep(6)
        await wait(800); await guard()
        }

        // ═══ PHASE 1: Safety Checklist + Photos ═══
        if (startFrom <= 1) {
        setPhase(1); setStep(0); setCursorVisible(true); setCountdownActive(false)
        await wait(600); await guard()

        setCursorPos({ x: '15%', y: '25%' })
        await wait(500); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(1)
        await wait(600); await guard()

        setCursorPos({ x: '85%', y: '25%' })
        await wait(400); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(2)
        await wait(800); await guard()

        setCursorPos({ x: '15%', y: '40%' })
        await wait(400); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(3)
        await wait(600); await guard()

        setCursorPos({ x: '85%', y: '40%' })
        await wait(400); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(4)
        await wait(800); await guard()

        setCursorPos({ x: '15%', y: '55%' })
        await wait(400); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(5)
        await wait(500); await guard()

        setCursorPos({ x: '15%', y: '68%' })
        await wait(400); await guard()
        setClicking(true); await wait(130); setClicking(false)
        setStep(6)
        await wait(400); await guard()

        setCursorVisible(false)
        setStep(7)
        await wait(1200); await guard()
        }

        // ═══ PHASE 2: Check-In Link Delivery ═══
        if (startFrom <= 2) {
        setPhase(2); setStep(0); setCursorVisible(false); setCountdownActive(false)
        await wait(600); await guard()
        setStep(1)
        await wait(900); await guard()
        setStep(2)
        await wait(1000); await guard()
        setStep(3)
        await wait(1500); await guard()
        }

        // ═══ PHASE 3: Live Tracking ═══
        if (startFrom <= 3) {
        setPhase(3); setStep(0); setCursorVisible(false); setCountdownActive(false)
        await wait(500); await guard()
        setStep(1)
        await wait(800); await guard()
        setStep(2)
        await wait(800); await guard()
        setStep(3)
        await wait(800); await guard()
        setStep(4)
        await wait(1500); await guard()
        }

        // ═══ PHASE 4: MISSED + ESCALATION ═══
        if (startFrom <= 4) {
        setPhase(4); setStep(0); setCursorVisible(false)
        await wait(400); await guard()
        setStep(1)
        await wait(800); await guard()
        setStep(2); setCountdownActive(true)
        await wait(1200); await guard()
        setStep(3)
        await wait(1500); await guard()
        setStep(4)
        await wait(1200); await guard()
        setStep(5)
        await wait(2000); await guard()
        }

        // ═══ PHASE 5: Compliance Report ═══
        setPhase(5); setStep(0); setCountdownActive(false); setCursorVisible(false)
        await wait(500); await guard()
        setStep(1)
        await wait(600); await guard()
        setStep(2)
        await wait(700); await guard()
        setStep(3)
        await wait(700); await guard()
        setStep(4)
        await wait(700); await guard()
        setStep(5)
        await wait(4000); await guard()

        setLoopCount(c => c + 1)
      } catch {
        // cancelled
      }
    }
    run()
    return () => { cancelled = true; clearTimeouts() }
  }, [loopCount, wait, click, clearTimeouts])

  const isAlertPhase = phase === 4 && step >= 1 && step < 5

  const glowColor = phase === 4 ? '#dc2626' : phase === 3 ? '#16a34a' : phase === 1 ? '#ea580c' : phase === 0 ? '#d97706' : '#1d4ed8'

  return (
    <div className="w-full relative">
      {/* Phase-reactive background glow */}
      <div
        aria-hidden
        className="glow-pulse pointer-events-none absolute -top-64 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 68%)` }}
      />

      {/* ── Two-column hero layout ── */}
      <div className="relative flex flex-col lg:flex-row lg:items-start lg:gap-8">

        {/* ── Left column: headline + stepper + CTA ── */}
        <div className="lg:w-[42%] lg:flex-shrink-0 lg:sticky lg:top-20 text-center lg:text-left mb-6 lg:mb-0 lg:pt-2">
          <h1
            className="text-3xl sm:text-4xl lg:text-[2.25rem] xl:text-[2.6rem] text-white leading-[1.12] tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Your fire watch logs won&apos;t survive{' '}
            <span className="text-transparent bg-clip-text hero-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444, #f97316, #ef4444)' }}>an OSHA audit.</span>
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed lg:max-w-sm mb-5">
            Your guy gets a secure check-in link. He taps it. You get proof he was there — with location, time, and a record nobody can change. If he misses one, you know in under 60 seconds.
          </p>

          {/* Phase stepper — vertical on desktop */}
          <div className="hidden lg:flex flex-col gap-0.5 mb-6">
            {phaseContent.map((p, i) => {
              const done = i < phase
              const active = i === phase
              const s = phaseActiveStyles[p.color] ?? phaseActiveStyles.blue
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => jumpToPhase(i)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-500 cursor-pointer text-left ${
                    active
                      ? `${s.bg} border ${s.border} shadow-lg ${s.shadow}`
                      : done
                        ? 'bg-green-500/5 border border-green-500/10 hover:bg-green-500/10'
                        : 'bg-transparent border border-transparent hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {done ? <Check size={10} color="#4ade80" /> : <span className="block w-2 h-2 rounded-full" style={{ background: active ? s.dot : '#475569' }} />}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[11px] font-bold leading-tight ${active ? s.text : done ? 'text-green-500/70' : 'text-slate-500'}`}>{p.label}</div>
                    <div className={`text-[10px] leading-tight mt-0.5 ${active ? 'text-slate-400' : 'text-slate-600'}`}>{p.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div>
            <Link
              href="/signup"
              className="cta-pulse inline-flex px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-blue-900/50 transition-all hover:-translate-y-0.5 hover:shadow-blue-700/60"
            >
              Try It on Your Next Watch →
            </Link>
            <p className="text-slate-600 text-xs mt-2.5">
              <span className="text-slate-400 font-semibold">$199/mo flat</span> · all your sites · money-back guarantee
            </p>
          </div>

          {/* Social proof */}
          <div className="hidden lg:flex items-center gap-3 mt-6 pt-5 border-t border-slate-800">
            <div className="flex -space-x-2">
              {['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500'].map((bg, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${bg} border-2 border-slate-950 flex items-center justify-center`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
              ))}
            </div>
            <div>
              <div className="text-slate-300 text-xs font-semibold">Built for the trades</div>
              <div className="text-slate-500 text-[10px]">Welders, pipefitters, mechanical contractors</div>
            </div>
          </div>
        </div>

        {/* ── Right column: demo ── */}
        <div className="lg:w-[58%] lg:flex-shrink-0">
          {/* Phase stepper — horizontal on mobile only */}
          <div className="lg:hidden mb-3">
            <PhaseStepper phase={phase} onJump={jumpToPhase} />
          </div>

          {/* ── Dark browser chrome ── */}
          <div className={`relative rounded-2xl overflow-hidden transition-all duration-700 ring-1 ${
        isAlertPhase
          ? 'ring-red-500/30 shadow-2xl shadow-red-500/10'
          : 'ring-white/[0.08] shadow-2xl shadow-black/60'
      }`}>
        {/* Title bar */}
        <div className={`flex items-center gap-2 px-4 py-2.5 border-b transition-colors duration-500 ${
          isAlertPhase ? 'bg-red-950 border-red-800/50' : 'bg-slate-800 border-slate-700'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className={`px-3 py-0.5 rounded text-[10px] font-mono transition-colors duration-500 ${
              isAlertPhase ? 'bg-red-900 text-red-300 border border-red-700/50' : 'bg-slate-900 text-slate-500 border border-slate-700/50'
            }`}>
              dutyproof.com{phase === 0 ? '/watches/new' : phase === 1 ? '/watches/new#checklist' : phase === 5 ? '/reports/a3f9c' : '/dashboard'}
            </div>
          </div>
          {(phase >= 3 && phase <= 4) && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
              isAlertPhase ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/10 text-green-400 border border-green-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isAlertPhase ? 'bg-red-400' : 'bg-green-400'} live-dot`} />
              {isAlertPhase ? 'ALERT' : 'LIVE'}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className={`relative overflow-hidden transition-colors duration-500 ${
          isAlertPhase ? 'bg-red-950/30' : 'bg-slate-900'
        }`} style={{ minHeight: phase === 5 ? 520 : phase === 4 ? 480 : 420 }}>

          <Cursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} visible={cursorVisible} />

          {/* ═══════════════════════════════════════════
              PHASE 0: Create Watch Form
          ═══════════════════════════════════════════ */}
          <div className={`absolute inset-0 transition-all duration-500 ${phase === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>New Fire Watch</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Fill in the details to start monitoring</p>
                </div>
                <div className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold">
                  Quick Setup
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Facility / Work Area</label>
                  <div className={`px-3 py-2.5 rounded-xl border transition-all duration-300 text-[13px] ${
                    phase === 0 && step >= 1 && step < 2
                      ? 'border-blue-500/60 bg-blue-950/50 ring-2 ring-blue-500/15'
                      : step >= 2 ? 'border-slate-700 bg-slate-800' : 'border-slate-700/50 bg-slate-800/50'
                  }`}>
                    {step >= 1 ? (
                      <span className="text-slate-200">{facilityText}<span className={`inline-block w-0.5 h-[14px] bg-blue-400 ml-0.5 align-middle ${step >= 2 ? 'opacity-0' : 'animate-pulse'}`} /></span>
                    ) : (
                      <span className="text-slate-600">Select a facility...</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Fire Watcher</label>
                    <div className={`px-3 py-2.5 rounded-xl border transition-all duration-300 text-[13px] ${
                      phase === 0 && step >= 2 && step < 3
                        ? 'border-blue-500/60 bg-blue-950/50 ring-2 ring-blue-500/15'
                        : step >= 3 ? 'border-slate-700 bg-slate-800' : 'border-slate-700/50 bg-slate-800/50'
                    }`}>
                      {step >= 2 ? (
                        <span className="text-slate-200">{guardText}<span className={`inline-block w-0.5 h-[14px] bg-blue-400 ml-0.5 align-middle ${step >= 3 ? 'opacity-0' : 'animate-pulse'}`} /></span>
                      ) : (
                        <span className="text-slate-600">Name</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Phone <span className="normal-case tracking-normal font-normal">(optional)</span></label>
                    <div className={`px-3 py-2.5 rounded-xl border transition-all duration-300 text-[13px] font-mono ${
                      phase === 0 && step >= 3 && step < 4
                        ? 'border-blue-500/60 bg-blue-950/50 ring-2 ring-blue-500/15'
                        : step >= 4 ? 'border-slate-700 bg-slate-800' : 'border-slate-700/50 bg-slate-800/50'
                    }`}>
                      {step >= 3 ? (
                        <span className="text-slate-200">{phoneText}<span className={`inline-block w-0.5 h-[14px] bg-blue-400 ml-0.5 align-middle ${step >= 4 ? 'opacity-0' : 'animate-pulse'}`} /></span>
                      ) : (
                        <span className="text-slate-600 text-xs">+1 (___) ___-____</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Check-in Interval</label>
                  <div className="flex gap-2">
                    {['15 min', '30 min', 'Custom'].map((label, i) => (
                      <button
                        key={label}
                        className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all duration-300 ${
                          i === 0 && step >= 4
                            ? 'bg-blue-600 text-white border-2 border-blue-500 shadow-lg shadow-blue-500/20'
                            : 'bg-slate-800/50 text-slate-600 border-2 border-slate-700/50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${step >= 5 ? 'bg-slate-800 border-slate-700' : 'bg-slate-800/30 border-slate-700/30'}`}>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-300">Supervisor Alerts</div>
                    <div className="text-[9px] text-slate-500">Notify on missed check-in</div>
                  </div>
                  <div className={`relative w-8 h-[18px] rounded-full transition-colors duration-300 ${step >= 5 ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    <div className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-all duration-300 ${step >= 5 ? 'left-[14px]' : 'left-[2px]'}`} />
                  </div>
                </div>

                <button className={`w-full py-3 rounded-xl text-[13px] font-bold transition-all duration-300 ${
                  step >= 6
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 scale-[0.98]'
                    : step >= 5
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-800 text-slate-600 cursor-default'
                }`}>
                  {step >= 6 ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check size={14} color="white" />
                      Watch Created — Next: Safety Checklist
                    </span>
                  ) : 'Start Watch'}
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              PHASE 1: Pre-Watch Safety Checklist + Photos
          ═══════════════════════════════════════════ */}
          <div className={`absolute inset-0 transition-all duration-500 ${phase === 1 ? 'opacity-100 translate-x-0' : phase > 1 ? 'opacity-0 -translate-x-12 pointer-events-none' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Pre-Watch Safety Checklist</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Harbor Steel — Welding Bay 2 · Required before watch starts</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all duration-500 ${
                  step >= 7
                    ? 'bg-green-500/15 border border-green-500/25 text-green-400'
                    : 'bg-orange-500/15 border border-orange-500/25 text-orange-400'
                }`}>
                  {step >= 7 ? '4/4 Complete' : `${step >= 6 ? 4 : step >= 5 ? 3 : step >= 3 ? 2 : step >= 1 ? 1 : 0}/4`}
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-2.5">
                {/* Item 1: Fire extinguisher */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-400 ${
                  step >= 1 ? 'bg-slate-800/80 border-green-500/20' : 'bg-slate-800/30 border-slate-700/30'
                }`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    step >= 1 ? 'bg-green-500 border-green-500' : 'border-slate-600 bg-transparent'
                  }`}>
                    {step >= 1 && <Check size={10} color="white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] font-semibold transition-colors duration-300 ${step >= 1 ? 'text-slate-200' : 'text-slate-400'}`}>
                      Fire extinguisher within 20 ft
                    </div>
                    <div className="text-[9px] text-slate-600">NFPA 51B §7.3 · Required</div>
                  </div>
                  {/* Photo thumbnail */}
                  <div className={`transition-all duration-500 ${step >= 2 ? 'opacity-100 scale-100' : step >= 1 ? 'opacity-70 scale-100' : 'opacity-30 scale-95'}`}>
                    {step >= 2 ? (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600/30 to-red-900/50 border border-red-500/20 flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Stylized extinguisher icon */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-400">
                          <rect x="8" y="6" width="8" height="14" rx="2" fill="currentColor" opacity="0.6" />
                          <rect x="10" y="3" width="4" height="4" rx="1" fill="currentColor" opacity="0.4" />
                          <path d="M12 3V1M14 3l2-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <div className="absolute bottom-0.5 right-0.5">
                          <Check size={8} color="#4ade80" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-600">
                        <CameraIcon size={14} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Item 2: Hot work permit */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-400 ${
                  step >= 3 ? 'bg-slate-800/80 border-green-500/20' : 'bg-slate-800/30 border-slate-700/30'
                }`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    step >= 3 ? 'bg-green-500 border-green-500' : 'border-slate-600 bg-transparent'
                  }`}>
                    {step >= 3 && <Check size={10} color="white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] font-semibold transition-colors duration-300 ${step >= 3 ? 'text-slate-200' : 'text-slate-400'}`}>
                      Hot work permit posted & signed
                    </div>
                    <div className="text-[9px] text-slate-600">OSHA 29 CFR 1910.252 · Required</div>
                  </div>
                  <div className={`transition-all duration-500 ${step >= 4 ? 'opacity-100 scale-100' : step >= 3 ? 'opacity-70 scale-100' : 'opacity-30 scale-95'}`}>
                    {step >= 4 ? (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-600/30 to-amber-900/50 border border-amber-500/20 flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Stylized permit icon */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                          <rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" opacity="0.3" />
                          <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                          <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                          <line x1="8" y1="14" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                          <path d="M13 16l2 2 4-4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="absolute bottom-0.5 right-0.5">
                          <Check size={8} color="#4ade80" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-600">
                        <CameraIcon size={14} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Item 3: Area clear of combustibles */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-400 ${
                  step >= 5 ? 'bg-slate-800/80 border-green-500/20' : 'bg-slate-800/30 border-slate-700/30'
                }`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    step >= 5 ? 'bg-green-500 border-green-500' : 'border-slate-600 bg-transparent'
                  }`}>
                    {step >= 5 && <Check size={10} color="white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] font-semibold transition-colors duration-300 ${step >= 5 ? 'text-slate-200' : 'text-slate-400'}`}>
                      Combustibles cleared within 35 ft
                    </div>
                    <div className="text-[9px] text-slate-600">NFPA 51B §7.2 · Visual confirmation</div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    step >= 5 ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-800/30 border border-slate-700/30'
                  }`}>
                    {step >= 5 ? <Check size={16} color="#4ade80" /> : <span className="text-slate-600 text-[8px]">N/A</span>}
                  </div>
                </div>

                {/* Item 4: Sprinklers operational */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-400 ${
                  step >= 6 ? 'bg-slate-800/80 border-green-500/20' : 'bg-slate-800/30 border-slate-700/30'
                }`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    step >= 6 ? 'bg-green-500 border-green-500' : 'border-slate-600 bg-transparent'
                  }`}>
                    {step >= 6 && <Check size={10} color="white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] font-semibold transition-colors duration-300 ${step >= 6 ? 'text-slate-200' : 'text-slate-400'}`}>
                      Sprinkler system operational
                    </div>
                    <div className="text-[9px] text-slate-600">NFPA 25 · If impaired, document variance</div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    step >= 6 ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-800/30 border border-slate-700/30'
                  }`}>
                    {step >= 6 ? <Check size={16} color="#4ade80" /> : <span className="text-slate-600 text-[8px]">N/A</span>}
                  </div>
                </div>
              </div>

              {/* Completion banner */}
              <div className={`mt-3 transition-all duration-500 ${step >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check size={16} color="white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold text-green-400">Checklist complete — 2 photos attached</div>
                    <div className="text-[9px] text-green-600">Locked to audit trail · Cannot be modified after submission</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              PHASE 2: Check-In Link Delivery + Worker Verification
          ═══════════════════════════════════════════ */}
          <div className={`absolute inset-0 transition-all duration-500 ${phase === 2 ? 'opacity-100 translate-x-0' : phase > 2 ? 'opacity-0 -translate-x-12 pointer-events-none' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Harbor Steel — Welding Bay 2</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">D. Kim · Check-in #1 of the watch</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-500 ${
                  step >= 3
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full live-dot ${step >= 3 ? 'bg-green-400' : 'bg-blue-400'}`} />
                  <span className={`text-[9px] font-bold ${step >= 3 ? 'text-green-400' : 'text-blue-400'}`}>
                    {step >= 3 ? 'Verified' : 'Sending'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left: Delivery methods */}
                <div className="space-y-3">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">How Workers Get the Link</div>

                  {/* QR Code — primary */}
                  <div className={`rounded-xl border p-3.5 transition-all duration-500 ${step >= 1 ? 'bg-blue-950/40 border-blue-500/25 opacity-100 translate-y-0' : 'bg-slate-800/30 border-slate-700/30 opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-white p-1.5 flex-shrink-0">
                        {/* Stylized QR code squares */}
                        <svg viewBox="0 0 40 40" width="100%" height="100%">
                          <rect x="2" y="2" width="12" height="12" rx="2" fill="#1e293b" />
                          <rect x="26" y="2" width="12" height="12" rx="2" fill="#1e293b" />
                          <rect x="2" y="26" width="12" height="12" rx="2" fill="#1e293b" />
                          <rect x="5" y="5" width="6" height="6" rx="1" fill="#3b82f6" />
                          <rect x="29" y="5" width="6" height="6" rx="1" fill="#3b82f6" />
                          <rect x="5" y="29" width="6" height="6" rx="1" fill="#3b82f6" />
                          <rect x="17" y="2" width="4" height="4" rx="1" fill="#1e293b" />
                          <rect x="17" y="10" width="4" height="4" rx="1" fill="#1e293b" />
                          <rect x="17" y="17" width="6" height="6" rx="1" fill="#1e293b" />
                          <rect x="26" y="17" width="4" height="4" rx="1" fill="#1e293b" />
                          <rect x="34" y="17" width="4" height="4" rx="1" fill="#1e293b" />
                          <rect x="17" y="26" width="4" height="4" rx="1" fill="#1e293b" />
                          <rect x="26" y="26" width="4" height="4" rx="1" fill="#1e293b" />
                          <rect x="34" y="26" width="4" height="4" rx="1" fill="#1e293b" />
                          <rect x="26" y="34" width="4" height="4" rx="1" fill="#1e293b" />
                          <rect x="34" y="34" width="4" height="4" rx="1" fill="#1e293b" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-bold text-slate-200">QR Code</span>
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">PRIMARY</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Supervisor shows QR on-site — worker scans to check in</p>
                      </div>
                    </div>
                  </div>

                  {/* Copy Link */}
                  <div className={`rounded-xl border p-3.5 transition-all duration-500 delay-100 ${step >= 2 ? 'bg-slate-800/60 border-slate-600/30 opacity-100 translate-y-0' : 'bg-slate-800/30 border-slate-700/30 opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </div>
                      <div>
                        <span className="text-[12px] font-bold text-slate-200">Copy Link</span>
                        <p className="text-[10px] text-slate-500">Share via any messaging app or paste into chat</p>
                      </div>
                    </div>
                  </div>

                  {/* SMS — optional */}
                  <div className={`rounded-xl border p-3.5 transition-all duration-500 delay-200 ${step >= 2 ? 'bg-slate-800/30 border-slate-700/20 opacity-100 translate-y-0' : 'bg-slate-800/30 border-slate-700/30 opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-bold text-slate-400">SMS</span>
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-slate-800 text-slate-500 border border-slate-700">OPTIONAL</span>
                        </div>
                        <p className="text-[10px] text-slate-600">Send link by text if worker opts in</p>
                      </div>
                    </div>
                  </div>

                  {/* Verified result */}
                  <div className={`rounded-xl border p-3.5 transition-all duration-600 ${step >= 3 ? 'bg-green-500/5 border-green-500/25 opacity-100 translate-y-0' : 'bg-slate-800/30 border-slate-700/30 opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Check size={11} color="white" />
                      </div>
                      <div>
                        <span className="text-[12px] font-bold text-green-400">Checked In</span>
                        <p className="text-[10px] text-slate-500">GPS 34.0521°N, 118.2437°W · Server-verified</p>
                      </div>
                    </div>
                    <div className="ml-8 flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/15 w-fit">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[9px] font-bold text-green-400">Logged to immutable audit trail</span>
                    </div>
                  </div>
                </div>

                {/* Right: Phone mockup — worker scanning QR */}
                <div className="flex items-center justify-center">
                  <div className="w-[200px] rounded-[1.75rem] bg-slate-800 border-[3px] border-slate-700 shadow-xl shadow-black/50 ring-1 ring-white/5">
                    <div className="rounded-[1.5rem] bg-slate-950 overflow-hidden relative" style={{ height: 340 }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-slate-800 rounded-b-xl z-10" />
                      <div className="flex items-center justify-between px-5 pt-2.5 text-[9px] text-slate-600">
                        <span className="font-semibold">9:41</span>
                        <span>5G</span>
                      </div>

                      <div className="px-3.5 pt-6">
                        {/* QR scan / link open state */}
                        <div className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
                          <div className="rounded-xl bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-3 text-center">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center mx-auto mb-2 text-white text-[8px] font-black">DP</div>
                            <p className="text-white text-[10px] font-semibold">Fire Watch Check-In</p>
                            <p className="text-slate-400 text-[8px] mt-0.5">Harbor Steel — Welding Bay 2</p>
                            <p className="text-slate-500 text-[7px] mt-1">D. Kim · Round #1</p>
                            <div className={`mt-3 transition-all duration-500 ${step >= 2 ? 'opacity-100 scale-100' : 'opacity-70 scale-95'}`}>
                              <div className="py-2.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold">
                                {step >= 3 ? '✓ Checked In' : 'CHECK IN NOW'}
                              </div>
                              <p className="text-slate-600 text-[7px] mt-1.5">GPS location will be recorded</p>
                            </div>
                          </div>
                        </div>

                        <div className={`mt-4 transition-all duration-500 ${step >= 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
                          <div className="rounded-xl bg-green-950/60 border border-green-800/50 p-4 text-center">
                            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-2">
                              <Check size={16} color="white" />
                            </div>
                            <p className="text-green-400 text-[11px] font-bold">Check-in Confirmed</p>
                            <p className="text-green-700 text-[8px] mt-1">GPS · 34.0521°N, 118.2437°W</p>
                            <p className="text-green-800 text-[7px] mt-0.5">10:00:12 AM · Server-verified</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              PHASE 3: Live Tracking
          ═══════════════════════════════════════════ */}
          <div className={`absolute inset-0 transition-all duration-500 ${phase === 3 ? 'opacity-100 translate-x-0' : phase > 3 ? 'opacity-0 -translate-x-12 pointer-events-none' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Harbor Steel — Welding Bay 2</h3>
                  <p className="text-[10px] text-slate-500">D. Kim · 15 min interval</p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
                  <span className="text-[9px] font-bold text-green-400">Live</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { v: step >= 3 ? '3' : step >= 2 ? '2' : step >= 1 ? '1' : '0', l: 'Check-ins', c: 'text-green-400', bg: 'bg-green-500/10 border-green-500/15' },
                  { v: '0', l: 'Missed', c: 'text-slate-500', bg: 'bg-slate-800/50 border-slate-700/30' },
                  { v: '100%', l: 'Compliance', c: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15' },
                ].map(s => (
                  <div key={s.l} className={`${s.bg} border rounded-xl p-2.5 text-center`}>
                    <div className={`text-lg font-black ${s.c}`} style={{ fontFamily: 'var(--font-display)' }}>{s.v}</div>
                    <div className="text-slate-500 text-[9px]">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
                {[
                  { time: '10:00 AM', gps: '34.0521°N, 118.2437°W', show: step >= 1 },
                  { time: '10:15 AM', gps: '34.0519°N, 118.2435°W', show: step >= 2 },
                  { time: '10:30 AM', gps: '34.0520°N, 118.2436°W', show: step >= 3 },
                ].map((ci, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/30 transition-all duration-500 ${ci.show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`} style={{ transitionDelay: `${i * 80}ms` }}>
                    <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                      <Check size={8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-300">Checked in</span>
                        <span className="text-[9px] text-slate-500 font-mono">{ci.time}</span>
                      </div>
                      <p className="text-[9px] text-slate-600 truncate">GPS {ci.gps} · server-verified</p>
                    </div>
                  </div>
                ))}

                <div className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-500 ${step >= 4 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}>
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 border-dashed flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">Awaiting check-in...</span>
                      <span className="text-[9px] text-amber-400 font-mono font-bold">10:45 AM</span>
                    </div>
                    <p className="text-[9px] text-slate-600">Link delivered · window open</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              PHASE 4: MISSED CHECK-IN + ESCALATION
          ═══════════════════════════════════════════ */}
          <div className={`absolute inset-0 transition-all duration-500 ${phase === 4 ? 'opacity-100 translate-x-0' : phase > 4 ? 'opacity-0 -translate-x-12 pointer-events-none' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
            <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none z-10 ${step >= 1 && step < 5 ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)' }} />

            <div className="p-5 sm:p-6 relative z-20">
              <div className={`transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${step >= 5 ? 'bg-green-500/15 border border-green-500/25' : 'bg-red-500/15 border border-red-500/25'}`}>
                      {step >= 5 ? (
                        <Check size={16} color="#4ade80" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      )}
                    </div>
                    <div>
                      <div className={`text-[13px] font-bold transition-colors duration-500 ${step >= 5 ? 'text-green-400' : 'text-red-400'}`}>
                        {step >= 5 ? 'Alert Resolved' : 'Missed Check-In'}
                      </div>
                      <div className="text-[10px] text-slate-500">Harbor Steel — D. Kim · 10:45 AM</div>
                    </div>
                  </div>
                  {step >= 2 && step < 5 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/25">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 live-dot" />
                      <span className="text-[11px] font-bold text-red-400 font-mono tabular-nums"><Countdown from={47} active={countdownActive} />s</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`rounded-xl border p-3.5 mb-4 transition-all duration-500 ${
                step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${step >= 5 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${step >= 5 ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                    {step >= 5 ? (
                      <Check size={18} color="#4ade80" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-[12px] font-bold mb-0.5 ${step >= 5 ? 'text-green-400' : 'text-red-400'}`}>
                      {step >= 5 ? 'Supervisor acknowledged in 38 seconds' : 'Check-in window expired'}
                    </div>
                    <div className={`text-[10px] ${step >= 5 ? 'text-green-600' : 'text-red-500/70'}`}>
                      {step >= 5
                        ? 'T. Okafor confirmed · GPS verified · Logged to immutable audit trail'
                        : step >= 2
                          ? 'Escalation in progress — notifying supervisor T. Okafor...'
                          : 'Detecting missed check-in...'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-600 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500/80 flex items-center justify-center text-white text-[7px] font-black">TO</div>
                    <div>
                      <div className="text-slate-300 text-[10px] font-semibold">T. Okafor · Supervisor</div>
                      <div className="text-slate-600 text-[8px]">+1 (555) 987-6543</div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-600 p-2.5 mb-2">
                    <p className="text-white text-[9px] leading-relaxed">
                      ⚠ MISSED: D. Kim missed 10:45 AM check-in at Harbor Steel — Bay 2. Acknowledge:
                    </p>
                    <p className="text-blue-200 text-[8px] mt-1 font-mono">dutyproof.com/ack/x9f2</p>
                  </div>
                  <div className={`transition-all duration-500 ${step >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="rounded-lg bg-green-950/60 border border-green-700/50 p-2 text-center">
                      <p className="text-green-400 text-[9px] font-bold flex items-center justify-center gap-1">
                        <Check size={9} color="#4ade80" />
                        Acknowledged · 10:45:38 AM
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-3">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Audit Trail</div>
                  <div className="space-y-1.5">
                    {[
                      { icon: '✕', label: 'Window expired', time: '10:45:00', c: 'bg-red-500/15 text-red-400', show: step >= 3 },
                      { icon: '→', label: 'Supervisor alerted', time: '10:45:02', c: 'bg-amber-500/15 text-amber-400', show: step >= 3 },
                      { icon: '✓', label: 'Supervisor ack\'d', time: '10:45:38', c: 'bg-green-500/15 text-green-400', show: step >= 4 },
                      { icon: '●', label: 'Logged · immutable', time: '10:45:38', c: 'bg-blue-500/15 text-blue-400', show: step >= 5 },
                    ].map((e, i) => (
                      <div key={i} className={`flex items-center gap-2 transition-all duration-400 ${e.show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`} style={{ transitionDelay: `${i * 60}ms` }}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[7px] font-bold ${e.c}`}>
                          {e.icon}
                        </div>
                        <span className="text-[10px] text-slate-400 flex-1">{e.label}</span>
                        <span className="text-[8px] text-slate-600 font-mono flex-shrink-0">{e.time}</span>
                      </div>
                    ))}
                  </div>
                  {step >= 5 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/30 flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      <span className="text-[9px] font-bold text-green-400">Response: 38 seconds</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary stats row — fills dead space */}
              <div className={`grid grid-cols-4 gap-2 mt-4 transition-all duration-500 ${step >= 5 ? 'opacity-100 translate-y-0' : step >= 3 ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {[
                  { v: '3', l: 'On-time', c: 'text-green-400', bg: 'bg-green-500/10 border-green-500/15' },
                  { v: '1', l: 'Missed', c: 'text-red-400', bg: 'bg-red-500/10 border-red-500/15' },
                  { v: '38s', l: 'Response', c: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15' },
                  { v: step >= 5 ? '88%' : '75%', l: 'Compliance', c: step >= 5 ? 'text-green-400' : 'text-amber-400', bg: step >= 5 ? 'bg-green-500/10 border-green-500/15' : 'bg-amber-500/10 border-amber-500/15' },
                ].map(s => (
                  <div key={s.l} className={`${s.bg} border rounded-xl p-2 text-center`}>
                    <div className={`text-sm font-black ${s.c}`} style={{ fontFamily: 'var(--font-display)' }}>{s.v}</div>
                    <div className="text-slate-600 text-[8px]">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              PHASE 5: Compliance Report
          ═══════════════════════════════════════════ */}
          <div className={`absolute inset-0 transition-all duration-500 ${phase === 5 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
            <div className="p-5 sm:p-6">
              <div className={`transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[9px] font-black text-blue-400 tracking-[0.12em] uppercase">DUTYPROOF</div>
                      <div className="text-[8px] font-bold text-orange-400 px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/15 rounded">COMPLIANCE REPORT</div>
                    </div>
                    <div className="text-[13px] font-bold text-white">Harbor Steel — Welding Bay 2</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">D. Kim · Mar 11, 2026 · ID: A3F9C12B</div>
                  </div>
                  <div className={`text-center transition-all duration-700 delay-200 ${step >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <div className="text-[28px] font-black text-green-400 leading-none" style={{ fontFamily: 'var(--font-display)' }}>88%</div>
                    <div className="text-[7px] text-slate-500 uppercase tracking-widest mt-0.5">Compliance</div>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl border border-slate-700/40 bg-slate-800/30 overflow-hidden mb-3 transition-all duration-500 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="px-3 py-1.5 bg-slate-800/60 border-b border-slate-700/30">
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Check-in Timeline</div>
                </div>
                <div className="divide-y divide-slate-700/20">
                  {[
                    { t: '10:00 AM', s: 'completed', gps: '34.0521°N' },
                    { t: '10:15 AM', s: 'completed', gps: '34.0519°N' },
                    { t: '10:30 AM', s: 'completed', gps: '34.0520°N' },
                    { t: '10:45 AM', s: 'missed',    gps: null },
                    { t: '10:45 AM', s: 'ack',       gps: '34.0518°N' },
                  ].map((ci, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        ci.s === 'completed' ? 'bg-green-400' : ci.s === 'missed' ? 'bg-red-400' : 'bg-amber-400'
                      }`} />
                      <span className="text-[9px] font-mono text-slate-500 w-14 flex-shrink-0">{ci.t}</span>
                      <span className={`text-[9px] font-semibold flex-1 ${
                        ci.s === 'completed' ? 'text-green-400' : ci.s === 'missed' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {ci.s === 'completed' ? 'Checked in' : ci.s === 'missed' ? 'MISSED' : "Supervisor ack'd"}
                      </span>
                      <span className="text-[8px] text-slate-600 font-mono">{ci.gps || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl border border-slate-700/40 bg-slate-800/30 overflow-hidden mb-3 transition-all duration-500 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="px-3 py-1.5 bg-slate-800/60 border-b border-slate-700/30 flex items-center justify-between">
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">GPS Verification — Site Map</div>
                  <div className="text-[7px] text-slate-600 font-mono">34.0521°N, 118.2437°W</div>
                </div>
                <div className="relative h-[80px] bg-slate-900/50 px-3 py-2">
                  <svg className="w-full h-full" viewBox="0 0 400 64">
                    {/* Building footprint */}
                    <rect x="60" y="6" width="180" height="52" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <text x="70" y="17" fill="#475569" fontSize="6" fontWeight="700">HARBOR STEEL — BLDG D</text>

                    {/* Welding bays */}
                    <rect x="70" y="22" width="50" height="28" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.75" />
                    <text x="78" y="32" fill="#64748b" fontSize="5">Bay 1</text>
                    <rect x="130" y="22" width="50" height="28" rx="2" fill="#172554" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,1.5" />
                    <text x="135" y="32" fill="#60a5fa" fontSize="5" fontWeight="700">Bay 2 ★</text>
                    <rect x="190" y="22" width="40" height="28" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.75" />
                    <text x="196" y="32" fill="#64748b" fontSize="5">Bay 3</text>

                    {/* Geofence radius */}
                    <circle cx="155" cy="36" r="22" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3,2" opacity="0.4" />
                    <text x="167" y="56" fill="#334155" fontSize="4">35 ft radius</text>

                    {/* Check-in pins inside geofence */}
                    <circle cx="148" cy="33" r="3" fill="#4ade80" stroke="#1e293b" strokeWidth="1.5" />
                    <circle cx="158" cy="30" r="3" fill="#4ade80" stroke="#1e293b" strokeWidth="1.5" />
                    <circle cx="153" cy="38" r="3" fill="#4ade80" stroke="#1e293b" strokeWidth="1.5" />
                    <circle cx="161" cy="36" r="3" fill="#4ade80" stroke="#1e293b" strokeWidth="1.5" />
                    <circle cx="145" cy="40" r="3" fill="#4ade80" stroke="#1e293b" strokeWidth="1.5" />

                    {/* Missed - slightly off */}
                    <circle cx="172" cy="42" r="3" fill="#ef4444" stroke="#1e293b" strokeWidth="1.5" />

                    {/* Supervisor ack */}
                    <circle cx="165" cy="26" r="3" fill="#f59e0b" stroke="#1e293b" strokeWidth="1.5" />

                    {/* Legend */}
                    <circle cx="280" cy="14" r="3" fill="#4ade80" stroke="#1e293b" strokeWidth="1" />
                    <text x="287" y="16.5" fill="#64748b" fontSize="5">On-site (5)</text>
                    <circle cx="280" cy="28" r="3" fill="#ef4444" stroke="#1e293b" strokeWidth="1" />
                    <text x="287" y="30.5" fill="#64748b" fontSize="5">No GPS (1)</text>
                    <circle cx="280" cy="42" r="3" fill="#f59e0b" stroke="#1e293b" strokeWidth="1" />
                    <text x="287" y="44.5" fill="#64748b" fontSize="5">Supervisor (1)</text>

                    {/* All within geofence label */}
                    <rect x="270" y="52" width="110" height="10" rx="2" fill="#166534" opacity="0.3" />
                    <text x="283" y="59.5" fill="#4ade80" fontSize="5" fontWeight="600">6/7 within geofence</text>
                  </svg>
                </div>
              </div>

              <div className={`flex items-center justify-between transition-all duration-700 ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-700 delay-200 ${step >= 4 ? 'border-green-500/25 bg-green-500/5' : 'border-transparent bg-transparent'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                  <div>
                    <div className="text-[10px] font-bold text-green-400">Ready for inspectors</div>
                    <div className="text-[8px] text-slate-600">Can&apos;t be edited · Can&apos;t be faked · Holds up in court</div>
                  </div>
                </div>
                <div className={`transition-all duration-500 ${step >= 5 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-bold shadow-lg shadow-blue-500/25 cta-pulse">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Download PDF
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
        </div>{/* end right column */}
      </div>{/* end flex row */}
    </div>
  )
}
