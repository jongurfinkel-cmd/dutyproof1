import Image from 'next/image'

// ─────────────────────────────────────────────────────────────
// Dashboard inner content
// ─────────────────────────────────────────────────────────────
function DashboardInner() {
  return (
    <>
      {/* Browser chrome */}
      <div className="bg-slate-800 px-3.5 py-2.5 flex items-center gap-3 border-b border-slate-700">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <div className="flex-1 bg-slate-900/70 rounded px-3 py-0.5 text-[9px] text-slate-500 font-mono truncate">
          app.dutyproof.com/dashboard
        </div>
      </div>

      {/* App top bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-white font-black text-xs" style={{ fontFamily: 'var(--font-display)' }}>
          DutyProof
        </span>
        <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-600/40 text-red-400 text-[9px] font-bold px-2.5 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 live-dot" />
          1 MISSED CHECK-IN
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-xs font-bold">Active Watches</span>
          <button className="text-[9px] font-bold text-blue-400 border border-blue-600/40 bg-blue-950/30 px-2.5 py-1 rounded-lg">
            + New Watch
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {([
            { v: '3',   l: 'Active',     c: 'text-green-400' },
            { v: '1',   l: 'Missed',     c: 'text-red-400'   },
            { v: '87%', l: 'Compliance', c: 'text-blue-300'  },
          ] as const).map(s => (
            <div key={s.l} className="bg-slate-800/50 rounded-xl p-2.5 text-center">
              <div className={`text-sm font-black ${s.c}`} style={{ fontFamily: 'var(--font-display)' }}>{s.v}</div>
              <div className="text-slate-500 text-[8px] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Alert banner */}
        <div className="flex items-start gap-2 bg-red-950/30 border border-red-600/25 rounded-xl p-2.5 mb-3">
          <span className="text-red-400 text-[9px] font-black shrink-0 mt-px">⚠</span>
          <p className="text-red-300 text-[9px] leading-snug">
            <span className="font-bold">Ace Mechanical — Building D</span> missed 2 min ago. Supervisor notified.
          </p>
        </div>

        {/* GPS Location Map */}
        <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-2.5 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Check-In Locations</span>
            <div className="flex items-center gap-2 text-[7px]">
              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />On-site</span>
              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Missed</span>
              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Ack</span>
            </div>
          </div>
          <div className="relative w-full h-[100px] rounded-lg overflow-hidden bg-slate-900/80 border border-slate-800">
            {/* Fake map grid */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 100" preserveAspectRatio="none">
              {/* Road grid */}
              <line x1="0" y1="35" x2="240" y2="35" stroke="#334155" strokeWidth="0.5" />
              <line x1="0" y1="70" x2="240" y2="70" stroke="#334155" strokeWidth="0.5" />
              <line x1="60" y1="0" x2="60" y2="100" stroke="#334155" strokeWidth="0.5" />
              <line x1="120" y1="0" x2="120" y2="100" stroke="#334155" strokeWidth="0.5" />
              <line x1="180" y1="0" x2="180" y2="100" stroke="#334155" strokeWidth="0.5" />
              {/* Building outlines */}
              <rect x="70" y="15" width="40" height="25" rx="2" fill="none" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
              <rect x="130" y="42" width="35" height="22" rx="2" fill="none" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
              {/* Patrol route */}
              <polyline points="45,50 80,28 120,30 148,52 190,45 210,60" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
              {/* Check-in pins */}
              <circle cx="45" cy="50" r="4" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
              <circle cx="80" cy="28" r="4" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
              <circle cx="120" cy="30" r="4" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
              <circle cx="148" cy="52" r="4" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
              <circle cx="190" cy="45" r="4" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
              <circle cx="210" cy="60" r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
              {/* Labels */}
              <text x="70" y="12" fill="#64748b" fontSize="5" fontWeight="600">BLDG A</text>
              <text x="130" y="40" fill="#64748b" fontSize="5" fontWeight="600">BLDG D</text>
            </svg>
            {/* Live indicator */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-slate-900/90 border border-slate-700/60 text-[7px] text-green-400 font-bold px-1.5 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-green-400 live-dot" />LIVE
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-2">
          <div className="bg-red-950/20 border border-red-600/30 rounded-xl p-3 cursor-default hover:border-red-500/50 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="text-white text-[10px] font-bold truncate">Ace Mechanical — Building D</p>
                <p className="text-slate-500 text-[8px]">J. Martinez · 30 min interval</p>
              </div>
              <span className="shrink-0 text-[8px] font-bold text-red-400 bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">✕ MISSED</span>
            </div>
            <p className="text-red-400/70 text-[8px]">Missed at 10:00 AM · Alert fired 2 min ago</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 cursor-default hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="text-white text-[10px] font-bold truncate">Harbor Steel — Welding Bay 2</p>
                <p className="text-slate-500 text-[8px]">D. Kim · 30 min interval</p>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-[8px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1 h-1 rounded-full bg-green-400 live-dot" />LIVE
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-green-400/80 text-[8px]">✓ Checked in 3 min ago · next in 27 min</p>
              <button className="shrink-0 text-[8px] text-blue-400 bg-blue-950/30 border border-blue-700/30 px-2 py-0.5 rounded font-semibold">PDF ↓</button>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 cursor-default hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="text-white text-[10px] font-bold truncate">Delta Pipeline — Pipe Shop</p>
                <p className="text-slate-500 text-[8px]">T. Okafor · 15 min interval</p>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-[8px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1 h-1 rounded-full bg-green-400 live-dot" />LIVE
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-slate-500 text-[8px]">SMS sent · due in 8 min · awaiting tap</p>
              <button className="shrink-0 text-[8px] text-blue-400 bg-blue-950/30 border border-blue-700/30 px-2 py-0.5 rounded font-semibold">PDF ↓</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Phone inner content (5 animated states)
// ─────────────────────────────────────────────────────────────
function PhoneInner() {
  return (
    <>
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-6 pb-2 text-[10px] text-slate-500 z-20">
        <span className="font-semibold">9:41</span>
        <span>5G ▓</span>
      </div>

      {/* State 1 — supervisor alert SMS */}
      <div className="ps1 absolute inset-0 flex flex-col items-center pt-14 px-4">
        <div className="text-slate-600 text-[9px] font-medium mb-5 tracking-widest uppercase">Tue, Jun 14</div>
        <div className="text-white text-4xl font-thin mb-6 tracking-tight">9:41</div>
        <div className="w-full rounded-2xl bg-slate-800/80 border border-slate-700/50 backdrop-blur p-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold">DP</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-white text-[9px] font-semibold">DutyProof</span>
                <span className="text-slate-500 text-[8px]">now</span>
              </div>
              <p className="text-slate-300 text-[9px] leading-relaxed">
                ⚠ Missed check-in: Ace Mechanical — Building D. Please verify immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* State 2 — checklist photo capture (fire extinguisher at job site) */}
      <div className="ps2 absolute inset-0 pt-12 px-3 flex flex-col">
        <div className="text-center mb-2">
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Checklist · Item 1 of 3</p>
          <p className="text-white text-[10px] font-bold mt-0.5">Fire extinguisher accessible</p>
        </div>
        {/* Camera viewfinder with real job site photo */}
        <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-700/60" style={{ minHeight: 200 }}>
          <Image
            src="/hero-extinguisher.jpg"
            alt="Fire extinguisher at job site for safety verification"
            fill
            className="object-cover"
            draggable={false}
          />
          {/* Subtle vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
          {/* Camera corner brackets */}
          <div className="absolute top-6 left-4 w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl" />
          <div className="absolute top-6 right-4 w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br" />
        </div>
        {/* Capture button */}
        <div className="flex items-center justify-center py-2.5">
          <div className="w-12 h-12 rounded-full border-[3px] border-white/80 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-white/90" />
          </div>
        </div>
        <p className="text-slate-600 text-[7px] text-center -mt-1 mb-1">Photo required · Tap to capture</p>
      </div>

      {/* State 3 — pre-watch checklist */}
      <div className="ps3 absolute inset-0 pt-12 px-4">
        <div className="text-center mb-3">
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Pre-Watch Checklist</p>
          <p className="text-white text-xs font-bold mt-0.5">Harbor Steel — Welding Bay 2</p>
        </div>
        <div className="h-1 bg-slate-800 rounded-full mb-3">
          <div className="h-full w-2/3 bg-green-500 rounded-full" />
        </div>
        <div className="space-y-2">
          {[
            { label: 'Fire extinguisher accessible', done: true  },
            { label: 'Hot works area clear',          done: true  },
            { label: 'Sprinkler system verified',     done: false },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${item.done ? 'bg-green-950/50 border border-green-800/40' : 'bg-slate-900 border border-slate-800'}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[8px] font-bold ${item.done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-600'}`}>
                {item.done ? '✓' : ''}
              </div>
              <span className={`text-[9px] flex-1 ${item.done ? 'text-green-300' : 'text-slate-400'}`}>{item.label}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black">SUBMIT CHECKLIST</button>
      </div>

      {/* State 4 — check-in button */}
      <div className="ps4 absolute inset-0 pt-12 px-4 flex flex-col">
        <div className="mb-3">
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Fire Watch Check-In</p>
          <p className="text-white text-sm font-bold mt-0.5">Harbor Steel — Welding Bay 2</p>
          <p className="text-slate-400 text-[9px]">D. Kim</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3">
          <p className="text-[8px] text-slate-500">Due</p>
          <p className="text-white font-bold text-sm">10:30 AM</p>
        </div>
        <button className="w-full py-7 rounded-2xl bg-green-500 text-white text-base font-black shadow-2xl shadow-green-900/50">CHECK IN NOW</button>
        <p className="text-slate-600 text-[8px] text-center mt-2">GPS location captured automatically.</p>
      </div>

      {/* State 5 — confirmed */}
      <div className="ps5 absolute inset-0 pt-12 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-full bg-green-900/50 border-2 border-green-500 flex items-center justify-center mb-3">
          <span className="text-green-400 text-xl font-black">✓</span>
        </div>
        <p className="text-white text-sm font-black mb-1">Check-In Confirmed</p>
        <p className="text-green-400 text-[9px] mb-4">Recorded & timestamped</p>
        <div className="w-full bg-green-950/30 border border-green-800/30 rounded-xl px-4 py-3">
          <p className="text-[8px] text-green-500 font-bold uppercase tracking-widest mb-1">Next Check-In Due</p>
          <p className="text-white text-lg font-black">10:30 AM</p>
          <p className="text-green-400 text-[8px]">Monday, Jun 14</p>
        </div>
        <p className="text-slate-600 text-[8px] mt-3">SMS link sent when window opens.</p>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Create Watch form mockup
// ─────────────────────────────────────────────────────────────
function CreateWatchMockup() {
  return (
    <div className="hero-f rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60 ring-1 ring-white/5 h-full">
      {/* Browser chrome */}
      <div className="bg-slate-800 px-3.5 py-2.5 flex items-center gap-3 border-b border-slate-700">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <div className="flex-1 bg-slate-900/70 rounded px-3 py-0.5 text-[9px] text-slate-500 font-mono truncate">
          app.dutyproof.com/watches/new
        </div>
      </div>

      <div className="p-4">
        {/* Form header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-black text-xs">New Fire Watch</p>
            <p className="text-slate-500 text-[8px]">Ready to monitor in under 2 minutes</p>
          </div>
          <span className="text-[8px] font-bold text-blue-400 bg-blue-950/40 border border-blue-700/40 px-2 py-1 rounded-lg whitespace-nowrap">2 min setup</span>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-3">
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Job Site *</p>
            <div className="flex items-center justify-between px-2.5 py-1.5 border border-slate-700 rounded-lg bg-slate-800/50 ring-1 ring-white/[0.04] text-[9px] text-slate-300 font-medium">
              <span className="truncate">Ace Mechanical</span>
              <span className="text-slate-600 ml-1 shrink-0">▾</span>
            </div>
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Work Area</p>
            <div className="px-2.5 py-1.5 border border-blue-500/60 rounded-lg bg-blue-950/40 text-[9px] text-blue-300 font-medium ring-1 ring-blue-500/25">
              Building D
            </div>
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fire Watcher *</p>
            <div className="px-2.5 py-1.5 border border-slate-700 rounded-lg bg-slate-800/50 ring-1 ring-white/[0.04] text-[9px] text-slate-300">
              J. Martinez
            </div>
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phone *</p>
            <div className="px-2.5 py-1.5 border border-slate-700 rounded-lg bg-slate-800/50 ring-1 ring-white/[0.04] text-[9px] text-slate-500 font-mono">
              +1 (213) •••-••••
            </div>
          </div>
        </div>

        {/* Interval + toggles */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Interval *</p>
            <div className="flex gap-1.5">
              <div className="flex-1 py-1.5 text-center border-2 border-blue-500 bg-blue-950/50 text-blue-300 rounded-lg text-[9px] font-black leading-tight">
                15 min<br /><span className="text-[7px] font-normal text-blue-500">most AHJs</span>
              </div>
              <div className="flex-1 py-1.5 text-center border-2 border-slate-700 text-slate-600 rounded-lg text-[9px] font-bold">30 min</div>
              <div className="flex-1 py-1.5 text-center border-2 border-slate-700 text-slate-600 rounded-lg text-[9px] font-bold">Custom</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Options</p>
            <div className="flex items-center justify-between px-2.5 py-1.5 border border-slate-700/60 rounded-lg bg-slate-800/40">
              <div>
                <p className="text-[8px] font-bold text-slate-300">Supervisor Alert</p>
                <p className="text-[7px] text-slate-600">On missed check-in</p>
              </div>
              <div className="relative w-7 h-3.5 bg-blue-600 rounded-full flex-shrink-0 ml-2">
                <span className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow" />
              </div>
            </div>
            <div className="flex items-center justify-between px-2.5 py-1.5 border border-slate-700/60 rounded-lg bg-slate-800/40">
              <div>
                <p className="text-[8px] font-bold text-slate-300">NFPA Checklist</p>
                <p className="text-[7px] text-slate-600">Pre-watch safety</p>
              </div>
              <div className="relative w-7 h-3.5 bg-slate-700 rounded-full flex-shrink-0 ml-2">
                <span className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-slate-400 rounded-full shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-blue-900/50">
          Start Watch &amp; Send SMS →
        </button>
        <p className="text-center text-[7px] text-slate-600 mt-1.5">
          Worker receives first check-in link by SMS · GPS auto-captured
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PDF compliance report mockup
// ─────────────────────────────────────────────────────────────
function PDFMockup() {
  const checkIns = [
    { t: '8:00 AM', s: 'completed', gps: '40.7580, -73.8855' },
    { t: '8:30 AM', s: 'completed', gps: '40.7581, -73.8854' },
    { t: '9:00 AM', s: 'missed',    gps: null                 },
    { t: '9:30 AM', s: 'completed', gps: '40.7579, -73.8856' },
    { t: '10:00 AM', s: 'completed', gps: '40.7580, -73.8855' },
  ]

  return (
    <div className="hero-r rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-2xl shadow-black/40 ring-1 ring-black/5 flex flex-col h-full">
      {/* Browser chrome — light theme */}
      <div className="bg-slate-100 px-3 py-2 flex items-center gap-2 border-b border-slate-200 flex-shrink-0">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400/70" />
          <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
          <div className="w-2 h-2 rounded-full bg-green-400/70" />
        </div>
        <div className="flex-1 bg-white rounded px-2 py-0.5 text-[8px] text-slate-400 font-mono truncate">
          Report · ID A3F9C12B
        </div>
        <a
          href="/sample-report.pdf"
          download
          className="flex items-center gap-1 text-[8px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded whitespace-nowrap hover:bg-blue-100 transition-colors"
        >
          ↓ PDF
        </a>
      </div>

      {/* PDF document */}
      <div className="p-3 space-y-2 flex-1 overflow-hidden">

        {/* Header */}
        <div className="border-b-[2.5px] border-[#1e3a5f] pb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-black text-[#1e3a5f] tracking-[0.12em] uppercase">DUTYPROOF</div>
            <div className="text-[7px] font-bold text-[#e85c0d] mt-0.5">Fire Watch Compliance Report</div>
            <div className="text-[6.5px] text-slate-400 mt-0.5 font-mono">ID: A3F9C12B · Mar 14, 2025 · Immutable</div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="text-[18px] font-black text-green-600 leading-none">88%</div>
            <div className="text-[6px] text-slate-400 uppercase tracking-widest">Compliance</div>
          </div>
        </div>

        {/* Job site info */}
        <div>
          <div className="text-[6.5px] font-bold text-[#1e3a5f] uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 mb-1 border-l-[2.5px] border-[#e85c0d]">
            JOB SITE INFORMATION
          </div>
          <div className="space-y-0.5 text-[7px]">
            <div className="flex gap-1 text-slate-600">
              <span className="font-semibold text-slate-700 flex-shrink-0 w-14">Site:</span>
              <span className="truncate">Ace Mechanical — LaGuardia B</span>
            </div>
            <div className="flex gap-1 text-slate-600">
              <span className="font-semibold text-slate-700 flex-shrink-0 w-14">Watcher:</span>
              <span>D. Kim · (718) 482-0194</span>
            </div>
            <div className="flex gap-1 text-slate-600">
              <span className="font-semibold text-slate-700 flex-shrink-0 w-14">Reason:</span>
              <span className="truncate">Post-weld watch — Bay 4</span>
            </div>
            <div className="flex gap-1 text-slate-600">
              <span className="font-semibold text-slate-700 flex-shrink-0 w-14">Interval:</span>
              <span>30 min (NFPA 51B §6.4)</span>
            </div>
          </div>
        </div>

        {/* Compliance stats */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { n: '88%', l: 'Rate',      c: 'text-green-600' },
            { n: '7',   l: 'Completed', c: 'text-green-600' },
            { n: '1',   l: 'Missed',    c: 'text-red-500'   },
            { n: '1',   l: 'Alert',     c: 'text-slate-700' },
          ].map(s => (
            <div key={s.l} className="bg-slate-50 border border-slate-100 rounded p-1 text-center">
              <div className={`text-[11px] font-black leading-none ${s.c}`}>{s.n}</div>
              <div className="text-[5.5px] text-slate-400 mt-0.5 uppercase tracking-wide">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Check-in timeline */}
        <div>
          <div className="text-[6.5px] font-bold text-[#1e3a5f] uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 mb-1 border-l-[2.5px] border-[#e85c0d]">
            CHECK-IN TIMELINE
          </div>
          <div className="space-y-0.5">
            {checkIns.map((ci, i) => (
              <div key={i} className="flex items-start gap-1.5 py-1 border-b border-slate-100 last:border-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${ci.s === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[7.5px] font-semibold text-slate-800">{ci.t}</span>
                    <span className={`text-[5.5px] font-bold uppercase tracking-wide ${ci.s === 'completed' ? 'text-green-600' : 'text-red-500'}`}>
                      {ci.s}
                    </span>
                  </div>
                  {ci.gps
                    ? <div className="text-[6px] text-slate-400 truncate">GPS: {ci.gps} · Server-verified ✓</div>
                    : <div className="text-[6px] text-red-400">Window expired · Supervisor alerted &lt;60s</div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GPS Verification Map */}
        <div>
          <div className="text-[6.5px] font-bold text-[#1e3a5f] uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 mb-1 border-l-[2.5px] border-[#e85c0d]">
            GPS VERIFICATION MAP
          </div>
          <div className="relative w-full h-[52px] rounded border border-slate-200 overflow-hidden bg-[#f1f0ec]">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 52" preserveAspectRatio="none">
              {/* Simplified street grid */}
              <line x1="0" y1="20" x2="200" y2="20" stroke="#d4d3cf" strokeWidth="0.5" />
              <line x1="0" y1="38" x2="200" y2="38" stroke="#d4d3cf" strokeWidth="0.5" />
              <line x1="50" y1="0" x2="50" y2="52" stroke="#d4d3cf" strokeWidth="0.5" />
              <line x1="100" y1="0" x2="100" y2="52" stroke="#d4d3cf" strokeWidth="0.5" />
              <line x1="150" y1="0" x2="150" y2="52" stroke="#d4d3cf" strokeWidth="0.5" />
              {/* Route line */}
              <polyline points="30,30 65,18 100,20 135,32 170,26" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
              {/* Pins */}
              <circle cx="30" cy="30" r="3" fill="#22c55e" stroke="#fff" strokeWidth="1" />
              <circle cx="65" cy="18" r="3" fill="#22c55e" stroke="#fff" strokeWidth="1" />
              <circle cx="100" cy="20" r="3" fill="#ef4444" stroke="#fff" strokeWidth="1" />
              <circle cx="135" cy="32" r="3" fill="#22c55e" stroke="#fff" strokeWidth="1" />
              <circle cx="170" cy="26" r="3" fill="#22c55e" stroke="#fff" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
          <div className="text-[6px] text-slate-400 leading-tight">
            Tamper-proof · Write-once<br />
            GPS + carrier verified
          </div>
          <div className="flex items-center gap-1 text-[7px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
            ✓ COMPLIANT
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main export — chronological order: Form → Phone → Dashboard → PDF
// ─────────────────────────────────────────────────────────────
export default function HeroProduct() {
  const dashboardCls = "hero-d rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60 ring-1 ring-white/5"

  return (
    <div className="flex-shrink-0 self-center lg:self-start">

      {/* ════ DESKTOP (lg+) ════ */}
      <div className="hidden lg:block">

        {/* Step labels — row 1: Form + Phone */}
        <div className="flex mb-2">
          <div style={{ width: 310, flexShrink: 0 }} className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[8px] font-black flex items-center justify-center flex-shrink-0">1</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Setup Form</span>
          </div>
          <div style={{ width: 245, flexShrink: 0, marginLeft: -44, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
            <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[8px] font-black flex items-center justify-center flex-shrink-0">2</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Worker SMS</span>
          </div>
        </div>

        {/* Row 1: Create Watch Form + Phone */}
        <div className="flex items-start">
          {/* Form — 310px */}
          <div style={{ width: 310, flexShrink: 0 }}>
            <CreateWatchMockup />
          </div>

          {/* Phone — 245px, -44px overlap, 32px top offset */}
          <div
            className="hero-p relative z-10"
            style={{ width: 245, flexShrink: 0, marginLeft: -44, marginTop: 32 }}
          >
            {/* Connecting badge — form triggers first SMS */}
            <div
              className="absolute -left-5 top-[45px] z-20 flex items-center gap-1.5 bg-blue-600 text-white text-[8px] font-black px-2.5 py-1.5 rounded-full whitespace-nowrap"
              style={{ boxShadow: '0 0 0 2px rgba(15,23,42,1), 0 0 20px rgba(37,99,235,0.7)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
              SMS sent · watch live
            </div>

            {/* Phone frame */}
            <div
              className="relative rounded-[2.5rem] bg-slate-800 border-[5px] border-slate-700 ring-1 ring-white/8"
              style={{ width: 245, filter: 'drop-shadow(-6px 20px 36px rgba(0,0,0,0.7))' }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-slate-800 rounded-b-2xl z-10" />
              <div className="rounded-[2rem] overflow-hidden bg-slate-950 relative" style={{ height: 440 }}>
                <PhoneInner />
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="mt-3 flex items-center gap-3" style={{ width: 511 }}>
          <div className="flex-1 h-px bg-slate-800/60" />
          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest shrink-0">watch in progress · ends with →</span>
          <div className="flex-1 h-px bg-slate-800/60" />
        </div>

        {/* Step labels — row 2: Dashboard + PDF */}
        <div className="mt-2 flex gap-2" style={{ width: 511 }}>
          <div className="flex-1 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[8px] font-black flex items-center justify-center flex-shrink-0">3</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Live Dashboard</span>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[8px] font-black flex items-center justify-center flex-shrink-0">4</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Compliance PDF</span>
          </div>
        </div>

        {/* Row 2: Dashboard + PDF side by side */}
        <div className="mt-1 flex gap-2" style={{ width: 511 }}>
          <div className="flex-1 min-w-0">
            <div className={dashboardCls}>
              <DashboardInner />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <PDFMockup />
          </div>
        </div>
      </div>

      {/* ════ MOBILE (< lg): form + dashboard stacked ════ */}
      <div className="lg:hidden" style={{ maxWidth: 340 }}>
        <div className={dashboardCls}>
          <DashboardInner />
        </div>
      </div>

    </div>
  )
}
