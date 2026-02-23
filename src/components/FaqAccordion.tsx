'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'How much does DutyProof cost?',
    a: '$149 per facility per month, billed monthly. No per-watch fees, no per-user fees, no setup costs. Your 14-day free trial includes full access — a credit card is required to start. Cancel any time before the trial ends and you will not be charged.',
  },
  {
    q: 'Does DutyProof meet fire watch documentation requirements?',
    a: 'DutyProof generates timestamped, GPS-verified, carrier-confirmed records for every check-in — the kind of documentation CMS surveyors, state fire marshals, and local AHJs look for when reviewing fire watch records. Every entry is server-timestamped and immutable. Note: DutyProof supports fire watch documentation workflows; each facility remains responsible for compliance with local AHJ, CMS, and applicable state requirements.',
  },
  {
    q: 'What check-in interval should we use for fire watches?',
    a: 'NFPA 101 Life Safety Code and most AHJs (Authorities Having Jurisdiction) require fire watches at intervals not exceeding 30 minutes when fire protection systems are impaired. Many facilities use 15-minute intervals for added safety. DutyProof supports any interval you configure — 15, 30, or custom.',
  },
  {
    q: 'What happens when a CMS surveyor or state inspector asks for our records?',
    a: 'Open DutyProof, go to Watch History, find the watch in question, and click Download Report. In under 60 seconds you have a print-ready PDF with every check-in, GPS coordinate, missed check-in alert, and timestamp — more detail than any paper-based system can provide.',
  },
  {
    q: 'Can I run watches across multiple wings, floors, or buildings?',
    a: 'Yes. Each watch is tied to a specific facility and location. You can run multiple simultaneous watches — one per building, wing, or impairment zone — each with its own worker, interval, and audit trail. All watches appear on your dashboard sorted by urgency.',
  },
  {
    q: 'What phone does the fire watch worker need?',
    a: 'Any phone that can receive a text message. No smartphone required, no app to download, no login. DutyProof sends a secure SMS link. The worker taps it, their GPS is captured, and the check-in is recorded. Even a basic flip phone works if it can receive SMS.',
  },
  {
    q: 'Is there a contract or long-term commitment?',
    a: 'No contracts. Month-to-month billing at $149/facility/month. Cancel any time from your account settings — no questions asked, no cancellation fee. Your historical compliance reports remain downloadable for 12 months after cancellation.',
  },
]

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-slate-200">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between gap-4 py-5 text-left group"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span
              className="text-slate-800 font-semibold text-base group-hover:text-blue-700 transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {faq.q}
            </span>
            <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
              open === i
                ? 'border-blue-500 bg-blue-500 text-white rotate-45'
                : 'border-slate-300 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-500'
            }`}>
              +
            </span>
          </button>
          {/* CSS grid trick for smooth height animation */}
          <div className={`grid transition-all duration-300 ease-in-out ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <p className="text-slate-500 text-sm leading-relaxed pb-5 pr-10">{faq.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
