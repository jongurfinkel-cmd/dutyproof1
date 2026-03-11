'use client'

import { useState } from 'react'

const FAQS: { q: string; a: string; bold: string }[] = [
  {
    q: 'How much does DutyProof cost?',
    a: '$199 per month, flat rate. Unlimited job sites. No per-watch fees, no per-user fees, no setup costs. Cancel any time — 30-day money-back guarantee.',
    bold: '$199 per month, flat rate',
  },
  {
    q: 'Does DutyProof meet OSHA hot work fire watch requirements?',
    a: 'DutyProof generates GPS-verified, server-timestamped, carrier-confirmed records for every check-in — exactly the kind of documentation OSHA inspectors, fire marshals, and insurance adjusters need when auditing hot work fire watch compliance. Every entry is immutable and write-once. Note: DutyProof supports fire watch documentation workflows; each contractor remains responsible for compliance with OSHA 29 CFR 1910.252, NFPA 51B, and local AHJ requirements.',
    bold: 'GPS-verified, server-timestamped, carrier-confirmed records',
  },
  {
    q: 'What check-in interval is required for a hot work fire watch?',
    a: 'OSHA 29 CFR 1910.252 and NFPA 51B require a fire watch to be maintained during and for at least 30 minutes after hot work operations. Most contractors run check-ins every 15–30 minutes during that post-work watch period. DutyProof supports any interval you configure — 15, 30, or custom.',
    bold: 'at least 30 minutes after hot work operations',
  },
  {
    q: 'What happens when an OSHA inspector or fire marshal asks for our records?',
    a: 'Open DutyProof, go to Watch History, find the watch in question, and click Download Report. In under 60 seconds you have a print-ready PDF with every check-in, GPS coordinate, missed check-in alert, and timestamp — more verifiable documentation than any paper log can provide.',
    bold: 'In under 60 seconds you have a print-ready PDF',
  },
  {
    q: 'Can I run multiple simultaneous watches on the same job site?',
    a: 'Yes. You can run multiple concurrent watches — one per work area, floor, or welding bay — each with its own assigned worker, check-in interval, and audit trail. All active watches appear on your dashboard sorted by urgency. One subscription covers all active watches at that job site.',
    bold: 'One subscription covers all active watches',
  },
  {
    q: 'What does the fire watch worker need?',
    a: 'Any smartphone with a web browser — no app to download, no login required. DutyProof generates a secure check-in link at each interval; the worker taps it and the check-in is recorded with a server-side timestamp and GPS coordinates. Links can be delivered via optional SMS, shared manually by a supervisor, or accessed from the dashboard.',
    bold: 'Any smartphone with a web browser',
  },
  {
    q: 'What if the job site has no cell service?',
    a: 'DutyProof works offline. If the worker opened the check-in link before losing signal (basements, parking garages, steel-framed buildings), they can still tap CHECK IN NOW. The check-in is saved to their phone with the device timestamp and GPS coordinates, then syncs automatically to the server the moment connectivity returns. No false misses, no panicked calls to the office. The compliance report shows both the device time and the sync time for a complete audit trail.',
    bold: 'DutyProof works offline',
  },
  {
    q: 'What if my worker doesn\'t check in on time?',
    a: 'DutyProof automatically marks the check-in as missed and alerts your supervisor within 60 seconds — with a tap-to-acknowledge link. Alerts can be delivered via dashboard notification or optional SMS. The supervisor taps the link to confirm they saw the alert, and their acknowledgment is GPS-logged and timestamped. The miss and the response are both permanently recorded in the audit trail. OSHA inspectors see not just that a gap was detected, but that management responded.',
    bold: 'alerts your supervisor within 60 seconds',
  },
  {
    q: 'Is there a contract or long-term commitment?',
    a: 'No contracts. $199/month, cancel any time from your account settings — no questions asked, no cancellation fee. Your records are retained for the life of your account, and compliance reports remain downloadable for 12 months after cancellation.',
    bold: 'No contracts',
  },
]

function BoldAnswer({ text, bold }: { text: string; bold: string }) {
  const idx = text.indexOf(bold)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <strong className="text-slate-700 font-semibold">{bold}</strong>
      {text.slice(idx + bold.length)}
    </>
  )
}

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div>
      {/* Quick answers strip */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 pb-8 border-b border-slate-200">
        {([
          '$199/mo flat',
          'No app for workers',
          'Works offline',
          'Cancel anytime',
        ] as const).map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5 text-slate-500 text-sm font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            {item}
          </span>
        ))}
      </div>

      <div className="divide-y divide-slate-200">
        {FAQS.map((faq, i) => (
          <div key={i}>
            <button
              id={`faq-trigger-${i}`}
              className="w-full flex items-center justify-between gap-4 py-5 text-left group"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              aria-controls={`faq-content-${i}`}
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
            <div id={`faq-content-${i}`} role="region" aria-labelledby={`faq-trigger-${i}`} className={`grid transition-all duration-300 ease-in-out ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <p className="text-slate-500 text-sm leading-relaxed pb-5 pr-10">
                  <BoldAnswer text={faq.a} bold={faq.bold} />
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
