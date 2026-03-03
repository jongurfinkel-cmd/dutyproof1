'use client'

import { useState } from 'react'
import RevealOnScroll from './RevealOnScroll'

const HERO_QUOTES = [
  {
    text: "Fire watch permit issued in and out same day. One per area, signed by the super. Mainly it's one guy with a fire extinguisher paying absolutely no attention to the person doing work.",
    role: 'Project Manager',
    context: 'Commercial Construction',
  },
  {
    text: "The process is solid on paper but it comes down to whoever is sitting there with the extinguisher. I've heard stories of fire watch falling asleep and the welder setting something on fire under himself. It's not a glamorous job — no one wants to just sit and watch. But it's necessary.",
    role: 'Mechanical Pipefitter Foreman',
    context: 'Industrial',
  },
  {
    text: "What usually breaks it is production pressure. Someone wants to get moving, the watch gets treated like a formality, or the after-watch window gets shortened because 'it looks fine.' The better setups I've seen make it harder to fake — time stamps, photos, and someone actually checking that the watch stayed in place.",
    role: 'Construction Manager',
    context: 'General Contracting',
  },
  {
    text: "Documentation says everything was fine. The field reality tells a completely different story. And the gap between those two things is where people get hurt. The ones who've actually fixed this did it by making verification something you can't fake — GPS-stamped photos with timestamps. Not a checkbox on a form.",
    role: 'Compliance Manager',
    context: 'Excavation & Utilities',
  },
]

const MORE_QUOTES = [
  {
    text: "I always thought of it like overnight security. Zero authority to do anything — only there to CYA and make a phone call if something happens. And they're usually sleeping or completely useless in the event something actually does happen.",
    role: 'Safety Manager',
    context: 'Facilities',
  },
  {
    text: "One job in 18 years in the trades. Just one — where the foreman actually got checked on the spot for pulling the fire watch off. That's the reality on the street.",
    role: 'Ironworker',
    context: '18 Years in the Field',
  },
  {
    text: "Paper permit, usually pencil whipped and generic. Fire watch is often the same mechanic who needed the welding done — they stick around because they have to finish the job. It's a conflict of interest from the start.",
    role: 'Mechanic',
    context: 'Mechanical Contracting',
  },
  {
    text: "Our fire watch was a joke. Safety standards were horrible and our foreman would push us to get the job done fast. We're supposed to stay an hour after hot work but they didn't want to pay us — so we'd leave right after welding.",
    role: 'Welder',
    context: 'Marine Fabrication',
  },
  {
    text: "They'll grab whoever's available — usually a first-year apprentice who has no idea what to watch for or what to do if something happens. And the hot work permit is just paperwork. Check the boxes, get a signature, move on.",
    role: 'Journeyman Ironworker',
    context: 'Commercial',
  },
]

function QuoteCard({ q }: { q: { text: string; role: string; context: string } }) {
  return (
    <div className="rounded-xl p-6 flex flex-col justify-between transition-all duration-200 cursor-default bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.05] hover:border-orange-500/20 hover:-translate-y-0.5">
      <div>
        <svg className="mb-3 opacity-[0.12]" width="18" height="14" viewBox="0 0 20 16" fill="none" aria-hidden="true">
          <path
            d="M8.2 0L5 5.2C2.8 8.6 1.6 11.2 1.6 13.2C1.6 14.8 2.6 16 4.4 16C6 16 7.2 14.8 7.2 13.2C7.2 11.8 6.2 10.6 4.8 10.6L5 10C5.2 9 6 7.4 7.2 5.6L8.2 4V0ZM18.2 0L15 5.2C12.8 8.6 11.6 11.2 11.6 13.2C11.6 14.8 12.6 16 14.4 16C16 16 17.2 14.8 17.2 13.2C17.2 11.8 16.2 10.6 14.8 10.6L15 10C15.2 9 16 7.4 17.2 5.6L18.2 4V0Z"
            fill="#f97316"
          />
        </svg>
        <p className="text-[15px] leading-relaxed text-slate-300">
          {q.text}
        </p>
      </div>
      <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-orange-500/10 to-amber-500/5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-300">{q.role}</div>
          <div className="text-[11px] text-slate-500">{q.context}</div>
        </div>
      </div>
    </div>
  )
}

export default function SocialProof() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section id="from-the-field" className="relative py-24 bg-slate-950 overflow-hidden">
      {/* Subtle glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.03) 0%, transparent 65%)' }}
      />

      <div className="relative max-w-5xl mx-auto px-6">

        {/* Header */}
        <RevealOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 text-[13px] font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Straight from the field
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.035em' }}
          >
            We went to the trades and<br />asked one question.
          </h2>
          <p
            className="text-xl sm:text-2xl text-slate-500 italic"
            style={{ letterSpacing: '-0.015em' }}
          >
            &ldquo;What does fire watch actually look like on your job sites?&rdquo;
          </p>
        </RevealOnScroll>

        {/* Stats row */}
        <RevealOnScroll delay={100} className="mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl bg-white/[0.04] overflow-hidden">
            {([
              { value: '100+', label: 'Field responses', accent: false },
              { value: '6', label: 'Trades represented', accent: false },
              { value: '#1', label: 'Answer: "Pencil-whipped"', accent: false },
              { value: '0', label: 'Said documentation works as designed', accent: true },
            ] as const).map((s, i) => (
              <div key={i} className="bg-slate-950 text-center py-7 px-4">
                <div
                  className={`font-extrabold leading-none mb-2 ${
                    s.accent ? 'text-2xl sm:text-3xl text-red-500' : 'text-3xl sm:text-4xl text-white'
                  }`}
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
                >
                  {s.value}
                </div>
                <div className="text-slate-600 text-xs font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <p className="text-center text-slate-600 text-xs mb-12">
          Collected from trade professionals across the field, 2025–2026.
          These responses shaped every feature in DutyProof. We&apos;re onboarding our first partners now.
        </p>

        {/* Hero quotes — first row */}
        <RevealOnScroll delay={150}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
            {HERO_QUOTES.slice(0, 2).map((q, i) => (
              <QuoteCard key={i} q={q} />
            ))}
          </div>
        </RevealOnScroll>

        {/* Pull stat break */}
        <RevealOnScroll delay={200}>
          <div className="rounded-xl bg-gradient-to-r from-red-500/[0.05] to-orange-500/[0.03] border border-red-500/10 p-8 sm:p-10 flex items-center justify-center gap-7 flex-wrap mb-3.5">
            <div
              className="text-3xl sm:text-4xl font-extrabold text-red-500 italic"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
            >
              Every. Single. One.
            </div>
            <div className="hidden sm:block w-px h-12 bg-red-500/15" />
            <div className="max-w-md">
              <p className="text-white/90 text-[15px] font-semibold mb-1.5">100+ tradespeople. Same answer.</p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Paper permits. Pencil-whipped logs. A warm body with an extinguisher and no accountability.
                Not one person said fire watch documentation is working as designed.
              </p>
            </div>
          </div>
        </RevealOnScroll>

        {/* Hero quotes — second row */}
        <RevealOnScroll delay={250}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {HERO_QUOTES.slice(2).map((q, i) => (
              <QuoteCard key={i + 2} q={q} />
            ))}
          </div>
        </RevealOnScroll>

        {/* Expand / collapse toggle */}
        <div className="text-center mt-10">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="px-8 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-500 text-sm font-medium hover:border-white/[0.16] hover:text-slate-300 transition-all"
          >
            {expanded ? 'Show less' : `Read ${MORE_QUOTES.length} more responses`}
          </button>
        </div>

        {/* Expanded quotes with staggered animation */}
        {expanded && (
          <>
            <style>{`
              @keyframes quoteReveal {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5">
              {MORE_QUOTES.map((q, i) => (
                <div
                  key={`more-${i}`}
                  style={{ animation: `quoteReveal 0.4s ease-out ${i * 80}ms backwards` }}
                >
                  <QuoteCard q={q} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
