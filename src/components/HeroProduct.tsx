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
              {/* FIX: slate-500 instead of slate-600 — readable on dark bg */}
              <div className="text-slate-500 text-[8px] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Alert banner */}
        <div className="flex items-start gap-2 bg-red-950/30 border border-red-600/25 rounded-xl p-2.5 mb-3">
          <span className="text-red-400 text-[9px] font-black shrink-0 mt-px">⚠</span>
          <p className="text-red-300 text-[9px] leading-snug">
            <span className="font-bold">Sunrise Gardens — West Wing</span> missed 2 min ago. Supervisor notified.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-2">
          <div className="bg-red-950/20 border border-red-600/30 rounded-xl p-3 cursor-default hover:border-red-500/50 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="text-white text-[10px] font-bold truncate">Sunrise Gardens — West Wing</p>
                <p className="text-slate-500 text-[8px]">J. Martinez · 30 min interval</p>
              </div>
              <span className="shrink-0 text-[8px] font-bold text-red-400 bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">✕ MISSED</span>
            </div>
            <p className="text-red-400/70 text-[8px]">Missed at 10:00 AM · Alert fired 2 min ago</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 cursor-default hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="text-white text-[10px] font-bold truncate">Sunrise Gardens — Wing B</p>
                <p className="text-slate-500 text-[8px]">R. Thompson · 30 min interval</p>
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
                <p className="text-white text-[10px] font-bold truncate">Meadow Creek SNF</p>
                <p className="text-slate-500 text-[8px]">K. Wilson · 15 min interval</p>
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
// Phone inner content (4 animated states)
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
                ⚠ Missed check-in: Sunrise Gardens — West Wing. Please verify immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* State 2 — pre-watch checklist */}
      <div className="ps2 absolute inset-0 pt-12 px-4 opacity-0">
        <div className="text-center mb-3">
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Pre-Watch Checklist</p>
          <p className="text-white text-xs font-bold mt-0.5">Sunrise Gardens — Wing B</p>
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

      {/* State 3 — check-in button */}
      <div className="ps3 absolute inset-0 pt-12 px-4 opacity-0 flex flex-col">
        <div className="mb-3">
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Fire Watch Check-In</p>
          <p className="text-white text-sm font-bold mt-0.5">Sunrise Gardens — Wing B</p>
          <p className="text-slate-400 text-[9px]">R. Thompson</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3">
          <p className="text-[8px] text-slate-500">Due</p>
          <p className="text-white font-bold text-sm">10:30 AM</p>
        </div>
        <button className="w-full py-7 rounded-2xl bg-green-500 text-white text-base font-black shadow-2xl shadow-green-900/50">CHECK IN NOW</button>
        <p className="text-slate-600 text-[8px] text-center mt-2">GPS location captured automatically.</p>
      </div>

      {/* State 4 — confirmed */}
      <div className="ps4 absolute inset-0 pt-12 px-4 opacity-0 flex flex-col items-center justify-center text-center">
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
// Create Watch form mockup (light theme — shows step 1 of workflow)
// ─────────────────────────────────────────────────────────────
function CreateWatchMockup() {
  return (
    <div className="hero-f rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60 ring-1 ring-white/5">
      {/* Browser chrome — dark, matches dashboard */}
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

        {/* 4 fields in 2×2 grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-3">
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Facility *</p>
            <div className="flex items-center justify-between px-2.5 py-1.5 border border-slate-700 rounded-lg bg-slate-800/50 ring-1 ring-white/[0.04] text-[9px] text-slate-300 font-medium">
              <span className="truncate">Sunrise Gardens</span>
              <span className="text-slate-600 ml-1 shrink-0">▾</span>
            </div>
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location / Area</p>
            <div className="px-2.5 py-1.5 border border-blue-500/60 rounded-lg bg-blue-950/40 text-[9px] text-blue-300 font-medium ring-1 ring-blue-500/25">
              West Wing
            </div>
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Worker Name *</p>
            <div className="px-2.5 py-1.5 border border-slate-700 rounded-lg bg-slate-800/50 ring-1 ring-white/[0.04] text-[9px] text-slate-300">
              J. Martinez
            </div>
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Worker Phone *</p>
            <div className="px-2.5 py-1.5 border border-slate-700 rounded-lg bg-slate-800/50 ring-1 ring-white/[0.04] text-[9px] text-slate-500 font-mono">
              +1 (213) •••-••••
            </div>
          </div>
        </div>

        {/* Bottom row: interval + toggles */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Check-in Interval *</p>
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
              {/* toggle ON */}
              <div className="relative w-7 h-3.5 bg-blue-600 rounded-full flex-shrink-0 ml-2">
                <span className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow" />
              </div>
            </div>
            <div className="flex items-center justify-between px-2.5 py-1.5 border border-slate-700/60 rounded-lg bg-slate-800/40">
              <div>
                <p className="text-[8px] font-bold text-slate-300">NFPA Checklist</p>
                <p className="text-[7px] text-slate-600">Pre-watch safety</p>
              </div>
              {/* toggle OFF */}
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
          Worker receives first check-in link by SMS immediately · GPS auto-captured on each tap
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────
export default function HeroProduct() {
  const dashboardCls = "hero-d rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60 ring-1 ring-white/5"

  return (
    <div className="flex-shrink-0 self-center lg:self-start">

      {/* ════ DESKTOP (lg+) ════ */}
      <div className="hidden lg:block">

        {/* Context labels — dashboard (left) and phone (right) */}
        <div className="flex mb-2">
          <div style={{ width: 310, flexShrink: 0 }} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot flex-shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Admin Dashboard</span>
          </div>
          {/* Phone label centered over the phone (starts at 310-44=266px, width 245px, center=388.5px) */}
          <div style={{ width: 245, flexShrink: 0, marginLeft: -44, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Worker SMS</span>
          </div>
        </div>

        {/* Dashboard + Phone */}
        <div className="flex items-start">
          {/* Dashboard — 310px */}
          <div className={dashboardCls} style={{ width: 310, flexShrink: 0 }}>
            <DashboardInner />
          </div>

          {/* Phone — 245px, -44px overlap, 32px top offset */}
          <div
            className="hero-p relative z-10"
            style={{ width: 245, flexShrink: 0, marginLeft: -44, marginTop: 32 }}
          >
            {/* Connecting badge — sits in overlap zone, ties dashboard "MISSED" alert → phone notification */}
            <div
              className="absolute -left-5 top-[45px] z-20 flex items-center gap-1.5 bg-red-500 text-white text-[8px] font-black px-2.5 py-1.5 rounded-full whitespace-nowrap"
              style={{ boxShadow: '0 0 0 2px rgba(15,23,42,1), 0 0 20px rgba(239,68,68,0.7)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
              ⚡ Alert fired · 47s
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

        {/* Separator — the form below creates everything above */}
        <div className="mt-3 flex items-center gap-3" style={{ width: 511 }}>
          <div className="flex-1 h-px bg-slate-800/60" />
          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest shrink-0">↑ all of the above, set up in 2 minutes</span>
          <div className="flex-1 h-px bg-slate-800/60" />
        </div>

        {/* Create Watch form mockup */}
        <div className="mt-2" style={{ width: 511 }}>
          <CreateWatchMockup />
        </div>
      </div>

      {/* ════ MOBILE (< lg): dashboard only ════ */}
      <div className="lg:hidden" style={{ maxWidth: 340 }}>
        <div className={dashboardCls}>
          <DashboardInner />
        </div>
      </div>

    </div>
  )
}
