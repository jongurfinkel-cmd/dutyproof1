'use client'

import { useEffect, useRef, useState } from 'react'

function AnimatedNumber({ value, visible }: { value: string; visible: boolean }) {
  const numMatch = value.replace(/,/g, '').match(/[\d.]+/)
  const prefix = value.match(/^[^\d]*/)?.[0] ?? ''
  const suffix = value.match(/[^\d.]*$/)?.[0] ?? ''
  const target = numMatch ? parseFloat(numMatch[0]) : 0
  const hasComma = value.includes(',')

  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (!visible || target === 0) { setDisplay(value); return }
    const duration = 1400
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(eased * target)
      const formatted = hasComma ? current.toLocaleString() : current.toString()
      setDisplay(prefix + formatted + suffix)
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [visible, target, prefix, suffix, hasComma, value])

  return <>{display}</>
}

const STATS = [
  {
    n: '4,630',
    l: 'structure fires per year caused by hot work',
    s: 'NFPA Fire Research',
    href: 'https://www.nfpa.org/education-and-research/research/nfpa-research/fire-statistical-reports/structure-fires-started-by-hot-work',
    highlight: false,
  },
  {
    n: '$355M',
    l: 'in property damage every year from hot work fires',
    s: 'NFPA Fire Research',
    href: 'https://www.nfpa.org/education-and-research/research/nfpa-research/fire-statistical-reports/structure-fires-started-by-hot-work',
    highlight: true,
  },
  {
    n: '48 min',
    l: 'avg time before a post-weld fire ignites — after the welder has left',
    s: 'NFPA 51B',
    href: 'https://www.nfpa.org/codes-and-standards/nfpa-51b-standard-development/51b',
    highlight: false,
  },
] as const

export default function HeroStats() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="mt-8 pt-6 border-t border-white/[0.07] grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
      {STATS.map((s, i) => (
        <div
          key={s.n}
          className={`text-center lg:text-left ${s.highlight ? 'rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3 -mx-2' : ''}`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: `opacity 0.5s ease ${i * 0.15}s, transform 0.5s ease ${i * 0.15}s`,
          }}
        >
          <div
            className={`font-black leading-none mb-1.5 ${s.highlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300' : 'text-white'}`}
            style={{ fontFamily: 'var(--font-display)', fontSize: s.highlight ? '2rem' : '1.75rem' }}
          >
            <AnimatedNumber value={s.n} visible={visible} />
          </div>
          <div className={`text-xs leading-snug ${s.highlight ? 'text-orange-300' : 'text-slate-400'}`}>{s.l}</div>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-400 text-[9px] mt-0.5 inline-block transition-colors"
          >
            {s.s} ↗
          </a>
        </div>
      ))}
    </div>
  )
}
