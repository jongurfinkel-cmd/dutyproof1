'use client'

import { useState } from 'react'

const TabIcons = [
  // SMS bubble
  <svg key="sms" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  // Alert bell
  <svg key="alert" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  // Wifi-off
  <svg key="offline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>,
  // File-text
  <svg key="pdf" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
]

const TABS = [
  { id: 0, label: 'SMS Check-Ins' },
  { id: 1, label: 'Missed Alerts' },
  { id: 2, label: 'Offline Mode' },
  { id: 3, label: 'PDF Reports' },
]

function SMSMockup() {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-2xl w-full max-w-xs mx-auto">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">DP</div>
        <div>
          <div className="text-white text-xs font-semibold">DutyProof</div>
          <div className="text-slate-500 text-[10px]">Automated SMS</div>
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
        <div className="text-xs text-slate-300 space-y-0.5">
          <div><span className="text-slate-400">Worker:</span> M. Rivera</div>
          <div><span className="text-slate-400">Alert fired:</span> 10:00:47 AM (47s elapsed)</div>
          <div><span className="text-slate-400">Notified:</span> Supervisor · (347) 821-4567</div>
        </div>
      </div>
      <div className="rounded-xl bg-slate-900 border border-slate-700 p-4 shadow-xl">
        <div className="text-slate-400 text-[9px] font-mono mb-2.5 flex items-center gap-1.5">
          <span className="text-red-400">▲</span> ESCALATION SMS · 10:00:47 AM
        </div>
        <p className="text-white text-xs leading-relaxed">
          🚨 <span className="text-red-400 font-semibold">MISSED CHECK-IN</span><br /><br />
          <span className="text-slate-300">Watch:</span> Ace Mechanical — Building D Weld<br />
          <span className="text-slate-300">Worker:</span> M. Rivera<br />
          <span className="text-slate-300">Was due:</span> 10:00 AM<br /><br />
          Tap to acknowledge:<br />
          <span className="text-amber-400 text-[10px] underline">dutyproof.com/ack/k9x3r...</span>
        </p>
      </div>
      <div className="rounded-xl bg-amber-950/50 border border-amber-600/50 p-4 shadow-xl">
        <div className="text-amber-400 text-[9px] font-mono mb-2 flex items-center gap-1.5">
          <span className="text-amber-300">✓</span> ACKNOWLEDGED · 10:03:12 AM
        </div>
        <p className="text-amber-200 text-xs leading-relaxed">
          T. Okafor acknowledged the alert<br />
          <span className="text-amber-300 text-[10px]">GPS: 34.052°N · Response time: 2m 25s</span>
        </p>
      </div>
    </div>
  )
}

function OfflineMockup() {
  return (
    <div className="space-y-3 w-full max-w-xs mx-auto">
      {/* Phone showing offline indicator */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-2xl">
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">DP</div>
            <div>
              <div className="text-white text-xs font-semibold">Fire Watch Check-In</div>
              <div className="text-slate-500 text-[10px]">Ace Mechanical — Bay 4</div>
            </div>
          </div>
        </div>
        {/* Offline banner */}
        <div className="px-4 py-2 bg-amber-950/50 border-b border-amber-800/30 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-amber-400 text-[10px] font-semibold">Offline — check-in will be queued</span>
        </div>
        {/* Big button */}
        <div className="p-5">
          <div className="w-full py-5 bg-green-500 text-white text-base font-black rounded-xl text-center shadow-lg">
            CHECK IN NOW
          </div>
        </div>
      </div>
      {/* Queued confirmation */}
      <div className="rounded-2xl bg-amber-950/30 border border-amber-700/40 p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-900/50 border-2 border-amber-500 flex items-center justify-center">
            <span className="text-amber-400 text-sm font-bold">✓</span>
          </div>
          <div>
            <div className="text-white text-xs font-bold">Check-In Queued</div>
            <div className="text-amber-300 text-[10px]">Saved to device · will sync automatically</div>
          </div>
        </div>
        <div className="bg-amber-900/30 rounded-lg px-3 py-2 mt-2">
          <div className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">Recorded at (device)</div>
          <div className="text-white text-sm font-bold">9:30:08 AM</div>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="text-amber-400 text-[10px] font-semibold">Waiting for connection...</span>
        </div>
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
        <div className="grid grid-cols-5 gap-1.5 pb-3 border-b border-slate-100">
          <div><div className="text-[7px] text-slate-400">Compliance</div><div className="text-sm font-bold text-green-700">93%</div></div>
          <div><div className="text-[7px] text-slate-400">Check-ins</div><div className="font-bold text-slate-800">14</div></div>
          <div><div className="text-[7px] text-slate-400">Missed</div><div className="font-bold text-red-600">1</div></div>
          <div><div className="text-[7px] text-slate-400">Alerts</div><div className="font-bold text-slate-800">1</div></div>
          <div><div className="text-[7px] text-slate-400">Ack&apos;d</div><div className="font-bold text-amber-600">1</div></div>
        </div>
        {/* GPS Map placeholder */}
        <div className="pb-3 border-b border-slate-100">
          <div className="text-[8px] text-slate-400 uppercase tracking-widest mb-1.5">GPS Coverage Map</div>
          <div className="w-full h-16 rounded bg-gradient-to-br from-green-50 via-green-100/50 to-blue-50 border border-slate-200 flex items-center justify-center">
            <span className="text-[8px] text-slate-400">2x2 OpenStreetMap tile grid · zoom 16</span>
          </div>
          <div className="text-[7px] text-slate-400 mt-1">Center: 34.0521°, -118.2437° · 14 GPS-verified check-ins</div>
        </div>
        <div>
          <div className="text-[8px] text-slate-400 uppercase tracking-widest mb-2">Check-In Log</div>
          <div className="space-y-1.5">
            {[
              { t: '08:00', s: '✓', c: 'text-green-700', d: '· GPS verified' },
              { t: '08:30', s: '✓', c: 'text-green-700', d: '· GPS verified' },
              { t: '09:00', s: '✕', c: 'text-red-600', d: '· Alert → Supervisor ack\'d' },
              { t: '09:30', s: '✓', c: 'text-green-700', d: '· GPS · offline → synced' },
            ].map((r) => (
              <div key={r.t} className={`flex items-center gap-2 ${r.c}`}>
                <span>{r.s}</span>
                <span className="text-slate-500">{r.t} AM</span>
                <span className="text-[8px]">{r.d}</span>
              </div>
            ))}
            <div className="text-slate-400 text-[9px]">··· 10 more entries</div>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-3 text-[8px] text-slate-400 text-center">
          OSHA-ready · GPS maps · Supervisor acknowledgments
        </div>
      </div>
    </div>
  )
}

const TAB_CONTENT = [
  {
    eyebrow: 'Zero-friction check-ins',
    eyebrowColor: 'text-blue-600',
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
    eyebrow: 'Closed-loop escalation',
    eyebrowColor: 'text-red-600',
    headline: 'Missed check-in?\nSupervisor acknowledges.',
    body: [
      'When a check-in window closes without a response, DutyProof marks it missed and fires an SMS to your supervisor in under 60 seconds — with a tap-to-acknowledge link.',
      'The supervisor taps the link to confirm they saw the alert and are responding. Their acknowledgment is GPS-logged and timestamped. OSHA inspectors see not just that a gap was detected, but that management responded.',
    ],
    bullets: [
      'Escalation fires in < 60 seconds',
      'Supervisor acknowledges via SMS link with GPS',
      'Full response chain logged in the compliance report',
      'Next check-in cycle continues automatically',
    ],
    bulletColor: 'bg-red-100 text-red-700',
    mockup: <EscalationMockup />,
  },
  {
    eyebrow: 'Works without signal',
    eyebrowColor: 'text-amber-600',
    headline: 'No signal?\nCheck-in still counts.',
    body: [
      'Hot work happens in basements, parking garages, and steel-framed buildings where cell service drops. DutyProof saves the check-in to the worker\'s phone with the device timestamp and GPS coordinates, then syncs it to the server the moment signal returns.',
      'No false misses. No panicked calls to the office. The worker taps CHECK IN NOW like normal — they see a "queued" confirmation instead of an error.',
    ],
    bullets: [
      'Check-in saved locally with device timestamp and GPS',
      'Syncs automatically when connectivity returns',
      'Works on iPhone and Android — no app needed',
      'Server records both device time and sync time for full audit trail',
    ],
    bulletColor: 'bg-amber-100 text-amber-700',
    mockup: <OfflineMockup />,
  },
  {
    eyebrow: 'Instant compliance proof',
    eyebrowColor: 'text-blue-600',
    headline: 'One click.\nOSHA-ready PDF report.',
    body: [
      'End any watch and download a complete compliance report immediately. Every check-in timestamped to the second, GPS coordinates, SMS delivery receipts, supervisor acknowledgments — formatted for OSHA inspections, fire marshal audits, and insurance claims.',
      'Includes a GPS coverage map showing exactly where your worker was, and a separate map for supervisor acknowledgments. This is the document you hand the fire marshal when they walk onto your job site.',
    ],
    bullets: [
      'GPS coverage map + supervisor acknowledgment map',
      'Full timeline with dual timestamps (device + server)',
      'Missed check-in log with supervisor response chain',
      'Compliance score with acknowledged count',
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
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-400/30 scale-[1.02]'
                : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className={active === t.id ? 'text-white' : ''}>{TabIcons[t.id]}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div key={active} className="tab-fade flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
        {/* Mockup — renders below copy on mobile, left on desktop */}
        <div className="flex-shrink-0 w-full max-w-xs">
          {tab.mockup}
        </div>

        {/* Copy — renders above mockup on mobile, right on desktop */}
        <div className="flex-1">
          <div className={`text-xs font-bold tracking-widest uppercase mb-3 ${tab.eyebrowColor}`}>{tab.eyebrow}</div>
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
