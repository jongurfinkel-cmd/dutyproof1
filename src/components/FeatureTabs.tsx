'use client'

import { useState } from 'react'

const TABS = [
  { id: 0, label: 'SMS Check-Ins', icon: '📱' },
  { id: 1, label: 'Missed Alerts', icon: '🚨' },
  { id: 2, label: 'PDF Reports', icon: '📋' },
]

function SMSMockup() {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-2xl w-full max-w-xs mx-auto">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">DP</div>
        <div>
          <div className="text-white text-xs font-semibold">DutyProof</div>
          <div className="text-slate-500 text-[10px]">+1 (888) 555-0190</div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-start">
          <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%]">
            <p className="text-white text-xs leading-relaxed">
              <span className="font-semibold">DUTYPROOF</span><br /><br />
              <span className="text-slate-300">Ace Mechanical — Building D Weld</span><br />
              Fire watch check-in due now.<br /><br />
              <span className="text-blue-400 text-[10px] underline">dutyproof.com/c/m7f2e1d...</span>
            </p>
            <div className="text-slate-500 text-[9px] mt-1.5">10:00 AM · Delivered ✓</div>
          </div>
        </div>
        <div className="text-center text-[9px] text-slate-600 font-mono py-1">— Worker tapped link · GPS: 1.4s —</div>
        <div className="flex justify-start">
          <div className="bg-green-900/50 border border-green-700/40 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%]">
            <p className="text-green-300 text-xs leading-relaxed">
              ✓ <span className="font-semibold">Confirmed</span><br />
              Ace Mechanical — Building D Weld<br />
              <span className="text-green-400 text-[10px]">10:00:09 AM · GPS: 34.052° N</span><br /><br />
              Next check-in: <span className="font-medium">10:30 AM</span>
            </p>
            <div className="text-green-800 text-[9px] mt-1.5">10:00 AM · Delivered ✓</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EscalationMockup() {
  return (
    <div className="space-y-3 w-full max-w-xs mx-auto">
      <div className="rounded-xl border-2 border-red-800/60 bg-red-950/40 p-4 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-[9px] font-bold tracking-widest uppercase">Missed Check-In</span>
        </div>
        <div className="text-white text-sm font-bold mb-0.5">Ace Mechanical — Building D Weld</div>
        <div className="text-red-400 text-xs font-medium mb-3">OVERDUE — last check-in 47 min ago</div>
        <div className="text-xs text-slate-400 space-y-0.5">
          <div><span className="text-slate-600">Worker:</span> M. Rivera</div>
          <div><span className="text-slate-600">Alert fired:</span> 10:00:47 AM (47s elapsed)</div>
          <div><span className="text-slate-600">Notified:</span> Supervisor · (555) 098-7654</div>
        </div>
      </div>
      <div className="rounded-xl bg-slate-900 border border-slate-700 p-4 shadow-xl">
        <div className="text-slate-600 text-[9px] font-mono mb-2.5 flex items-center gap-1.5">
          <span className="text-red-500">▲</span> ESCALATION SMS · 10:00:47 AM
        </div>
        <p className="text-white text-xs leading-relaxed">
          🚨 <span className="text-red-400 font-semibold">MISSED CHECK-IN</span><br /><br />
          <span className="text-slate-400">Watch:</span> Ace Mechanical — Building D Weld<br />
          <span className="text-slate-400">Worker:</span> M. Rivera<br />
          <span className="text-slate-400">Was due:</span> 10:00 AM<br /><br />
          <span className="text-slate-300">Immediate action required.</span>
        </p>
      </div>
    </div>
  )
}

function PDFMockup() {
  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-[10px] font-mono w-full max-w-xs mx-auto">
      <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="text-slate-500 text-[9px] ml-2 truncate">dutyproof-acemechanical-2026-03-02.pdf</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <div className="text-xs font-bold text-slate-800 mb-1">DUTYPROOF COMPLIANCE REPORT</div>
          <div className="text-[9px] text-slate-500">Ace Mechanical · Building D · Hot Work Watch</div>
          <div className="text-[9px] text-slate-500">Generated: Jun 14, 2025 · 14:38 UTC</div>
        </div>
        <div className="grid grid-cols-3 gap-2 pb-3 border-b border-slate-100">
          <div><div className="text-[8px] text-slate-400">Compliance</div><div className="text-sm font-bold text-green-700">93%</div></div>
          <div><div className="text-[8px] text-slate-400">Check-ins</div><div className="font-bold text-slate-800">14</div></div>
          <div><div className="text-[8px] text-slate-400">Missed</div><div className="font-bold text-red-600">1</div></div>
        </div>
        <div>
          <div className="text-[8px] text-slate-400 uppercase tracking-widest mb-2">Check-In Log</div>
          <div className="space-y-1.5">
            {[{ t: '08:00', s: '✓', c: 'text-green-700' }, { t: '08:30', s: '✓', c: 'text-green-700' }, { t: '09:00', s: '✕', c: 'text-red-600' }, { t: '09:30', s: '✓', c: 'text-green-700' }].map((r) => (
              <div key={r.t} className={`flex items-center gap-2 ${r.c}`}>
                <span>{r.s}</span>
                <span className="text-slate-500">{r.t} AM</span>
                <span className="text-[8px]">{r.s === '✓' ? '· GPS verified' : '· Alert sent to supervisor'}</span>
              </div>
            ))}
            <div className="text-slate-400 text-[9px]">··· 10 more entries</div>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-3 text-[8px] text-slate-400 text-center">
          OSHA-ready · Tamper-proof · Server timestamps
        </div>
      </div>
    </div>
  )
}

const TAB_CONTENT = [
  {
    eyebrow: 'Zero-friction check-ins',
    headline: 'Workers check in\nfrom a text message.',
    body: [
      'DutyProof sends a secure, one-time SMS link at every interval — 15 or 30 minutes, your choice. Your fire watch taps one button. No app, no login, no training required.',
      'If no one taps it in time, it automatically counts as missed. No manual oversight needed.',
    ],
    bullets: [
      'One-tap check-in from any cell phone',
      'Links expire at the next interval',
      'GPS captured automatically on check-in',
      'Confirmation SMS sent back to the worker',
    ],
    bulletColor: 'bg-blue-100 text-blue-700',
    mockup: <SMSMockup />,
  },
  {
    eyebrow: 'Automatic escalation',
    headline: 'A missed check-in triggers\nan alert in under 60 seconds.',
    body: [
      'When a check-in window closes without a response, DutyProof immediately marks it missed and fires an SMS to your supervisor, administrator, or any on-call contact you designate.',
      'The miss is recorded permanently — immutable. OSHA inspectors, fire marshals, and insurance adjusters will see exactly what happened and when.',
    ],
    bullets: [
      'Escalation fires in < 60 seconds',
      'Supervisor gets full context — job site, worker, due time',
      'Miss recorded permanently, cannot be altered',
      'Next check-in cycle continues automatically',
    ],
    bulletColor: 'bg-red-100 text-red-700',
    mockup: <EscalationMockup />,
  },
  {
    eyebrow: 'Instant compliance proof',
    headline: 'One click.\nOSHA-ready PDF report.',
    body: [
      'End any watch and download a complete compliance report immediately. Every check-in timestamped to the second, GPS coordinates, SMS delivery receipts — formatted for OSHA inspections, fire marshal audits, and insurance claims.',
      'This is the document you hand the fire marshal when they walk onto your job site.',
    ],
    bullets: [
      'Full timeline with GPS and dual timestamps',
      'Missed check-in log with escalation records',
      'Compliance score, job site info, worker record',
      'Available the moment the watch ends',
    ],
    bulletColor: 'bg-slate-100 text-slate-700',
    mockup: <PDFMockup />,
  },
]

export default function FeatureTabs() {
  const [active, setActive] = useState(0)
  const tab = TAB_CONTENT[active]

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-10 justify-center lg:justify-start">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              active === t.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div key={active} className="tab-fade flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Mockup */}
        <div className="flex-shrink-0 w-full max-w-xs">
          {tab.mockup}
        </div>

        {/* Copy */}
        <div className="flex-1">
          <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">{tab.eyebrow}</div>
          <h3
            className="text-4xl text-slate-900 leading-tight mb-5 whitespace-pre-line"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            {tab.headline}
          </h3>
          {tab.body.map((p, i) => (
            <p key={i} className="text-slate-500 text-base leading-relaxed mb-4 last:mb-8">
              {p}
            </p>
          ))}
          <div className="space-y-2.5">
            {tab.bullets.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${tab.bulletColor}`}>✓</div>
                <span className="text-slate-600 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
