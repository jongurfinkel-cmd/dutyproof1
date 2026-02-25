'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'How much does DutyProof cost?',
    a: '$99 per job site per month, billed monthly. No per-watch fees, no per-user fees, no setup costs. Your 60-day free trial includes full access — cancel any time before the trial ends and you will not be charged.',
  },
  {
    q: 'Does DutyProof meet OSHA hot work fire watch requirements?',
    a: 'DutyProof generates GPS-verified, server-timestamped, carrier-confirmed records for every check-in — exactly the kind of documentation OSHA inspectors, fire marshals, and insurance adjusters need when auditing hot work fire watch compliance. Every entry is immutable and write-once. Note: DutyProof supports fire watch documentation workflows; each contractor remains responsible for compliance with OSHA 29 CFR 1910.252, NFPA 51B, and local AHJ requirements.',
  },
  {
    q: 'What check-in interval is required for a hot work fire watch?',
    a: 'OSHA 29 CFR 1910.252 and NFPA 51B require a fire watch to be maintained during and for at least 30 minutes after hot work operations. Most contractors run check-ins every 15–30 minutes during that post-work watch period. DutyProof supports any interval you configure — 15, 30, or custom.',
  },
  {
    q: 'What happens when an OSHA inspector or fire marshal asks for our records?',
    a: 'Open DutyProof, go to Watch History, find the watch in question, and click Download Report. In under 60 seconds you have a print-ready PDF with every check-in, GPS coordinate, missed check-in alert, and timestamp — more verifiable documentation than any paper log can provide.',
  },
  {
    q: 'Can I run multiple simultaneous watches on the same job site?',
    a: 'Yes. You can run multiple concurrent watches — one per work area, floor, or welding bay — each with its own assigned worker, check-in interval, and audit trail. All active watches appear on your dashboard sorted by urgency. One subscription covers all active watches at that job site.',
  },
  {
    q: 'What phone does the fire watch worker need?',
    a: 'Any phone that can receive a text message — no app to download, no login required. DutyProof sends a secure SMS link at each interval; the worker taps it and the check-in is recorded with a server-side timestamp and carrier delivery receipt. GPS coordinates are captured automatically on smartphones. On basic phones without GPS, the check-in still records with full timestamp and SMS confirmation.',
  },
  {
    q: 'How does DutyProof help with insurance claims?',
    a: 'When a fire or incident occurs, your insurer and the fire marshal will ask what your fire watch documented. A DutyProof PDF shows exactly where your worker was and when, with GPS coordinates and carrier-confirmed SMS delivery — evidence that actual coverage occurred, not just a handwritten log that anyone could fill in after the fact.',
  },
  {
    q: 'Is there a contract or long-term commitment?',
    a: 'No contracts. Month-to-month billing at $99/site/month. Cancel any time from your account settings — no questions asked, no cancellation fee. Your historical compliance reports remain downloadable for 12 months after cancellation.',
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
