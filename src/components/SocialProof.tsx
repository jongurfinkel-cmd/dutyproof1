'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import RevealOnScroll from './RevealOnScroll'

const QUOTES = [
  {
    text: "One guy with a fire extinguisher paying absolutely no attention to the person doing work. That's fire watch on most of my jobs.",
    role: 'Project Manager',
    context: 'Commercial Construction',
  },
  {
    text: "We're supposed to stay an hour after hot work but they didn't want to pay us — so we'd leave right after welding.",
    role: 'Welder',
    context: 'Marine Fabrication',
  },
  {
    text: "Documentation says everything was fine. The field reality tells a completely different story. That gap is where people get hurt.",
    role: 'Compliance Manager',
    context: 'Excavation & Utilities',
  },
  {
    text: "The watch gets treated like a formality. The after-watch window gets shortened because 'it looks fine.' Then something catches three hours later.",
    role: 'Construction Manager',
    context: 'General Contracting',
  },
  {
    text: "Fire watch is often the same mechanic who needed the welding done — they stick around because they have to finish the job. It's a conflict of interest from the start.",
    role: 'Mechanic',
    context: 'Mechanical Contracting',
  },
]

export default function SocialProof() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const advance = useCallback(() => {
    setActive((a) => (a + 1) % QUOTES.length)
  }, [])

  // Auto-advance every 5s unless user has interacted
  useEffect(() => {
    if (paused) return
    timerRef.current = setTimeout(advance, 5000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [active, paused, advance])

  function goTo(i: number) {
    setActive(i)
    setPaused(true)
    // Resume auto-advance after 12s of inactivity
    setTimeout(() => setPaused(false), 12000)
  }

  // Touch swipe support
  const touchStart = useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo((active + 1) % QUOTES.length)
      else goTo((active - 1 + QUOTES.length) % QUOTES.length)
    }
    touchStart.current = null
  }

  return (
    <section className="relative py-20 sm:py-28 bg-slate-950 overflow-hidden">
      {/* Background texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6">

        {/* ── Header ── */}
        <RevealOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-500/[0.08] border border-red-500/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-semibold tracking-wide">100+ tradespeople surveyed</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.035em' }}
          >
            We asked the trades one question.
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 mt-4 max-w-lg mx-auto leading-relaxed">
            &ldquo;How does fire watch actually work on your jobs?&rdquo;
          </p>
          <p
            className="text-red-500 text-base sm:text-lg font-bold mt-4"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            A hundred conversations. Same answer. Every time.
          </p>
        </RevealOnScroll>

        {/* ── Stacked Card Deck ── */}
        <div
          className="relative max-w-lg mx-auto mb-6"
          style={{ height: 260 }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {QUOTES.map((q, i) => {
            const offset = (i - active + QUOTES.length) % QUOTES.length
            const isBehind = offset === QUOTES.length - 1

            let x = 0, y = 0, scale = 1, opacity = 1, z = 50, rotate = 0

            if (isBehind) {
              x = -40; y = 0; scale = 0.95; opacity = 0; z = 0; rotate = -3
            } else if (offset === 0) {
              x = 0; y = 0; scale = 1; opacity = 1; z = 40; rotate = 0
            } else if (offset === 1) {
              x = 20; y = 10; scale = 0.96; opacity = 0.6; z = 30; rotate = 1.8
            } else if (offset === 2) {
              x = 38; y = 18; scale = 0.92; opacity = 0.35; z = 20; rotate = 3.2
            } else if (offset === 3) {
              x = 52; y = 24; scale = 0.88; opacity = 0.15; z = 10; rotate = 4.5
            } else {
              x = 60; y = 28; scale = 0.85; opacity = 0; z = 0; rotate = 5
            }

            return (
              <div
                key={i}
                onClick={() => offset !== 0 && goTo(i)}
                className={`absolute inset-x-0 top-0 transition-all duration-[600ms] ease-out ${
                  offset === 0 ? '' : 'cursor-pointer'
                }`}
                style={{
                  transform: `translateX(${x}px) translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`,
                  zIndex: z,
                  opacity,
                  transformOrigin: 'bottom left',
                }}
              >
                <div className={`rounded-2xl p-7 sm:p-8 transition-all duration-[600ms] ${
                  offset === 0
                    ? 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-2 border-orange-500/25 shadow-[0_8px_40px_-8px_rgba(249,115,22,0.15)]'
                    : 'bg-slate-900/90 border-2 border-white/[0.06] hover:border-white/[0.12]'
                }`}>
                  {/* Quote mark */}
                  <svg className={`mb-4 transition-opacity duration-500 ${offset === 0 ? 'opacity-20' : 'opacity-[0.06]'}`} width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
                    <path d="M10.2 0L6.2 6.5C3.5 10.7 2 14 2 16.5C2 18.5 3.2 20 5.5 20C7.5 20 9 18.5 9 16.5C9 14.7 7.7 13.3 6 13.3L6.2 12.5C6.5 11.2 7.5 9.2 9 7L10.2 5V0ZM24.2 0L20.2 6.5C17.5 10.7 16 14 16 16.5C16 18.5 17.2 20 19.5 20C21.5 20 23 18.5 23 16.5C23 14.7 21.7 13.3 20 13.3L20.2 12.5C20.5 11.2 21.5 9.2 23 7L24.2 5V0Z" fill={offset === 0 ? '#f97316' : '#ffffff'} />
                  </svg>
                  <p className={`text-[15px] sm:text-base leading-relaxed mb-6 transition-colors duration-500 ${
                    offset === 0 ? 'text-slate-100' : 'text-slate-400'
                  }`}>
                    {q.text}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                      offset === 0
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                        : 'bg-white/[0.04] text-slate-600 border border-white/[0.06]'
                    }`}>
                      {q.role.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold transition-colors duration-500 ${
                        offset === 0 ? 'text-orange-400' : 'text-slate-500'
                      }`}>{q.role}</div>
                      <div className="text-xs text-slate-600">{q.context}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Dots ── */}
        <div className="flex items-center justify-center gap-2 mb-16">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Quote ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-7 h-2 bg-orange-500'
                  : 'w-2 h-2 bg-white/10 hover:bg-white/25'
              }`}
            />
          ))}
        </div>

        {/* ── The Closer ── */}
        <RevealOnScroll delay={100}>
          {/* Divider line */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-slate-700" />
            <div className="w-2 h-2 rounded-full bg-blue-500/30 border border-blue-500/20" />
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-slate-700" />
          </div>

          <div className="max-w-xl mx-auto text-center">
            <h3
              className="text-2xl sm:text-3xl text-white font-bold leading-snug mb-4"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.025em' }}
            >
              DutyProof fixes this.
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-sm text-slate-400 mb-8">
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                GPS&#8209;verified check&#8209;ins
              </span>
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                Tamper&#8209;proof records
              </span>
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                60&#8209;second escalation
              </span>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-base shadow-xl shadow-blue-900/40 transition-all hover:-translate-y-0.5 hover:shadow-blue-800/50"
            >
              Start Your First Watch →
            </Link>
            <p className="mt-4 text-slate-600 text-xs">
              No app to install · No training · One link per watch
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
