import Link from 'next/link'
import RevealOnScroll from '@/components/RevealOnScroll'
import FeatureTabs from '@/components/FeatureTabs'
import FaqAccordion from '@/components/FaqAccordion'
import CostCalculator from '@/components/CostCalculator'
import HeroProduct from '@/components/HeroProduct'

export const metadata = {
  title: 'DutyProof — Fire Watch Compliance for Assisted Living & Nursing Homes',
  description:
    'DutyProof automates fire watch check-ins via SMS, escalates missed check-ins in under 60 seconds, and generates CMS-ready PDF compliance reports — built for assisted living, skilled nursing facilities, and memory care communities.',
  openGraph: {
    title: 'DutyProof — Automated Fire Watch Compliance',
    description:
      'SMS check-ins, missed-check-in alerts in under 60 seconds, and one-click CMS-ready PDF reports. Built for assisted living, skilled nursing, and memory care facilities.',
    url: 'https://dutyproof.com',
    siteName: 'DutyProof',
    type: 'website',
    images: [
      {
        url: 'https://dutyproof.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DutyProof — Fire Watch Compliance for Care Facilities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DutyProof — Automated Fire Watch Compliance',
    description:
      'SMS check-ins, missed-check-in alerts in under 60 seconds, and one-click CMS-ready PDF reports.',
  },
}

const timelineItems = [
  { time: '08:00 AM', status: 'completed', label: 'Checked in', detail: 'GPS 34.0521°N · SMS confirmed', delay: '0.1s' },
  { time: '08:30 AM', status: 'completed', label: 'Checked in', detail: 'GPS 34.0519°N · SMS confirmed', delay: '0.5s' },
  { time: '09:00 AM', status: 'missed',    label: 'MISSED — Alert sent to supervisor', detail: 'SMS escalation fired · 47 sec elapsed', delay: '0.9s' },
  { time: '09:30 AM', status: 'completed', label: 'Checked in', detail: 'GPS 34.0522°N · SMS confirmed', delay: '1.3s' },
  { time: '10:00 AM', status: 'pending',   label: 'Pending · due in 8 min', detail: 'SMS delivered · awaiting tap', delay: '1.7s' },
]

const includedFeatures = [
  'Unlimited active watches per facility',
  'Automated SMS check-ins (15 or 30 min intervals)',
  'Location capture on every check-in',
  'Missed check-in escalation in < 60 seconds',
  'Tamper-proof immutable audit log',
  'One-click CMS-ready PDF reports',
  'Searchable watch history — any date, any worker',
  'SMS delivery receipt logging',
  'Unlimited admin & supervisor accounts',
  'Direct email & chat support',
]

const FACILITY_TYPES = [
  'Assisted Living Communities',
  'Skilled Nursing Facilities',
  'Memory Care Communities',
  'Nursing Homes',
  'Rehabilitation Centers',
  'Continuing Care Retirement Communities',
  'Intermediate Care Facilities',
  'Residential Care Homes',
]

export default function LandingPage() {
  const tickerItems = [...FACILITY_TYPES, ...FACILITY_TYPES]

  return (
    <>
      <style>{`
        /* ── Shared ── */
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Hero product entrance ── */
        @keyframes heroUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-d { animation: heroUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
        .hero-p { animation: heroUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both; }
        .hero-f { animation: heroUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both; }

        /* Timeline rows: only animate when parent has reveal-visible */
        .anim-row {
          opacity: 0;
          animation: none;
        }
        .timeline-trigger.reveal-visible .anim-row {
          animation: fadeSlideIn 0.4s ease forwards;
        }

        /* ── Comparison card hover ── */
        .moment-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
        }
        .moment-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
        }

        /* ── Live dot blink ── */
        @keyframes liveBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        .live-dot { animation: liveBlink 1.8s ease-in-out infinite; }

        /* ── Phone 4-state animation (12s loop) ── */
        @keyframes ps1 {
          0%   { opacity: 1; }  18%  { opacity: 1; }
          23%  { opacity: 0; }  93%  { opacity: 0; }
          98%  { opacity: 1; }  100% { opacity: 1; }
        }
        @keyframes ps2 {
          0%   { opacity: 0; }  23%  { opacity: 0; }
          28%  { opacity: 1; }  43%  { opacity: 1; }
          48%  { opacity: 0; }  100% { opacity: 0; }
        }
        @keyframes ps3 {
          0%   { opacity: 0; }  48%  { opacity: 0; }
          53%  { opacity: 1; }  68%  { opacity: 1; }
          73%  { opacity: 0; }  100% { opacity: 0; }
        }
        @keyframes ps4 {
          0%   { opacity: 0; }  73%  { opacity: 0; }
          78%  { opacity: 1; }  93%  { opacity: 1; }
          98%  { opacity: 0; }  100% { opacity: 0; }
        }
        .ps1 { animation: ps1 9s ease-in-out infinite; }
        .ps2 { animation: ps2 9s ease-in-out infinite; }
        .ps3 { animation: ps3 9s ease-in-out infinite; }
        .ps4 { animation: ps4 9s ease-in-out infinite; }

        /* ── Hero glow breathe ── */
        @keyframes glowPulse {
          0%, 100% { opacity: 0.18; }
          50%      { opacity: 0.28; }
        }
        .glow-pulse { animation: glowPulse 4s ease-in-out infinite; }
      `}</style>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-950 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          aria-hidden
          className="glow-pulse pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 68%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-20">

            {/* ── Copy ── */}
            <div className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none lg:pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-widest mb-8 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 live-dot" />
                Built by a Firefighter · Fire Watch Compliance
              </div>

              <h1
                className="text-6xl sm:text-7xl lg:text-[7.5rem] text-white leading-[0.9] tracking-tight mb-8"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                At your most<br />
                vulnerable<br />
                moment,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-blue-300 to-sky-300">
                  be ready.
                </span>
              </h1>

              <p className="text-slate-300 text-xl leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
                When CMS arrives. When the state surveyor calls.
                When a family files a complaint — your fire watch record
                is either bulletproof or it isn&apos;t. DutyProof makes it bulletproof.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-base shadow-xl shadow-blue-900/50 transition-all hover:-translate-y-0.5 hover:shadow-blue-700/60"
                >
                  Start 14-Day Free Trial →
                </Link>
                <a
                  href="#the-moment"
                  className="px-8 py-4 text-white/70 hover:text-white font-semibold rounded-xl text-base border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 transition-all"
                >
                  See the real scenario ↓
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-slate-400 font-medium">
                <span className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Set up in under 2 minutes</span>
                <span className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> CMS-ready PDF reports</span>
                <span className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> No app for workers</span>
              </div>

              {/* ── Risk stats strip — sourced from CMS / NFPA ── */}
              <div className="mt-8 pt-6 border-t border-white/[0.07] grid grid-cols-3 gap-x-6 gap-y-5">
                {([
                  {
                    n: '$18K',
                    l: 'average CMS fine, fire safety deficiency',
                    s: 'NursingHome411 / CMS',
                    href: 'https://nursinghome411.org/alert-citations-penalties/',
                  },
                  {
                    n: 'Annual',
                    l: 'Life Safety Code survey — you will be inspected this year',
                    s: 'CMS State Operations Manual',
                    href: 'https://www.cms.gov/Regulations-and-Guidance/Guidance/Manuals/downloads/som107ap_i_lsc.pdf',
                  },
                  {
                    n: '4 hrs',
                    l: 'fire alarm offline = mandatory fire watch',
                    s: 'NFPA 101 §9.6.1.6',
                    href: 'https://www.hfmmagazine.com/articles/4043-defining-a-fire-watch-for-nfpa-compliance',
                  },
                ] as const).map(s => (
                  <div key={s.n} className="text-center lg:text-left">
                    <div className="text-white font-black leading-none mb-1.5" style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem' }}>{s.n}</div>
                    <div className="text-slate-400 text-xs leading-snug">{s.l}</div>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-400 text-[9px] mt-0.5 inline-block transition-colors"
                    >
                      {s.s} ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Interactive product showcase ── */}
            <HeroProduct />

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FACILITY TYPE TICKER
      ════════════════════════════════════════ */}
      <div className="bg-slate-900 border-b border-slate-800 py-3 overflow-hidden">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-6 text-slate-600 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border-r border-slate-800 mr-4">Built for</div>
          <div className="relative overflow-hidden flex-1 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <div className="flex gap-10 ticker-track">
              {tickerItems.map((name, i) => (
                <span key={i} className="inline-flex items-center gap-2 text-slate-400 text-sm font-medium flex-shrink-0">
                  <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          PROOF STRIP
      ════════════════════════════════════════ */}
      <section className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <RevealOnScroll className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { n: '< 60 sec', l: 'Missed check-in alert to supervisor' },
              { n: 'Write-once', l: 'Audit log — no edits, no deletions, ever' },
              { n: '1-click',   l: 'CMS-ready PDF downloaded, any time' },
              { n: '0 apps',   l: 'Workers need to install' },
            ].map((s) => (
              <div key={s.n}>
                <div className="text-2xl text-white mb-0.5" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>{s.n}</div>
                <div className="text-slate-500 text-xs">{s.l}</div>
              </div>
            ))}
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════════════════════════════════
          THE MOMENT — care facility narrative
      ════════════════════════════════════════ */}
      <section id="the-moment" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-16">
            <h2
              className="text-4xl lg:text-5xl text-slate-900 max-w-3xl mx-auto leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              The surveyor arrived Monday.<br />The fire watch incident was Friday.
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={150} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Without DutyProof */}
            <div className="rounded-2xl bg-red-950/5 border-2 border-red-200 p-8 moment-card">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold tracking-wide mb-6 uppercase">
                ✕ Without DutyProof
              </div>
              <div className="space-y-5 text-slate-600 text-base leading-relaxed">
                <p>
                  The CMS surveyor asked for your fire watch documentation.
                  You pulled out a binder of handwritten logs.
                  Some entries were illegible. Two shift changes had no record at all.
                </p>
                <p>
                  There was no way to prove the watch was conducted as required —
                  no timestamps, no GPS, no delivery confirmation.
                  The surveyor is writing it up as a deficiency.
                </p>
                <p>
                  Your survey rating takes the hit. Your families find out.
                </p>
              </div>
              <div className="mt-7 p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="text-red-700 font-bold text-lg">$21,393/day</div>
                <div className="text-red-600 text-sm">CMS civil monetary penalty — immediate jeopardy</div>
                <a
                  href="https://www.cms.gov/medicare/provider-enrollment-and-certification/surveycertificationgeninfo/downloads/qso19-05-all.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-600 text-[9px] mt-1 inline-block transition-colors"
                >
                  CMS §488.438 Civil Monetary Penalties ↗
                </a>
              </div>
            </div>

            {/* With DutyProof */}
            <div className="rounded-2xl bg-blue-950/5 border-2 border-blue-200 p-8 moment-card">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wide mb-6 uppercase">
                ✓ With DutyProof
              </div>
              <div className="space-y-5 text-slate-600 text-base leading-relaxed">
                <p>
                  You open a browser, click Download Report, and
                  hand the surveyor a PDF in under 60 seconds.
                </p>
                <p>
                  Every check-in timestamped to the second, GPS-verified,
                  and carrier-confirmed. Server-side and immutable —
                  exactly what happened and when, and it can&apos;t be altered.
                </p>
                <p>
                  The surveyor reviews it. Closes the inquiry. You move on.
                </p>
              </div>
              <div className="mt-7 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="text-blue-700 font-bold text-lg">Same day.</div>
                <div className="text-blue-600 text-sm">Inquiry closed. Documentation speaks for itself.</div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════════════════════════════════
          LIVE DEMO — animated timeline
      ════════════════════════════════════════ */}
      <section id="demo" className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
            <RevealOnScroll className="flex-1">
              <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">Tamper-proof by design</div>
              <h2
                className="text-4xl lg:text-5xl text-slate-900 leading-tight mb-5"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                An immutable audit trail,<br />building in real time.
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-5">
                Every check-in is written once and locked — no edits, no deletions, no backdating.
                Each row captures a server-side timestamp, location data, and a carrier-confirmed SMS delivery receipt.
              </p>
              <p className="text-slate-500 text-base leading-relaxed">
                Missed a check-in? An alert fires to your supervisor or on-call admin within 60 seconds.
                The miss is recorded permanently — whether or not it&apos;s ever resolved.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={100} className="flex-shrink-0 w-full max-w-md timeline-trigger">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Sunrise Gardens — Wing B</div>
                    <div className="text-slate-500 text-xs mt-0.5">R. Thompson · 30 min · started 5h ago</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600 text-sm font-bold">80%</div>
                    <div className="text-slate-400 text-[10px]">compliance</div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {timelineItems.map((row) => (
                    <div
                      key={row.time}
                      className="anim-row flex items-center gap-3.5 px-5 py-3"
                      style={{ animationDelay: row.delay }}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        row.status === 'completed' ? 'bg-green-100 text-green-700' :
                        row.status === 'missed'    ? 'bg-red-100 text-red-600' :
                                                     'bg-slate-100 text-slate-400'
                      }`}>
                        {row.status === 'completed' ? '✓' : row.status === 'missed' ? '✕' : '…'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[10px] font-mono shrink-0">{row.time}</span>
                          <span className={`text-xs font-semibold truncate ${
                            row.status === 'completed' ? 'text-slate-800' :
                            row.status === 'missed'    ? 'text-red-600' :
                                                         'text-slate-500'
                          }`}>{row.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{row.detail}</div>
                      </div>
                      {row.status === 'pending' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 live-dot flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 text-[9px] text-slate-400 font-mono">
                  RLS enforced · server timestamps only · no UPDATE/DELETE permitted
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURE TABS — interactive
      ════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-12">
            <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">Complete compliance toolkit</div>
            <h2
              className="text-4xl lg:text-5xl text-slate-900 leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Built for the way care<br />facilities actually operate.
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <FeatureTabs />
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ
      ════════════════════════════════════════ */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-12">
            <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">Common questions</div>
            <h2
              className="text-4xl text-slate-900"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Questions facility directors ask
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <FaqAccordion />
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════════════════════════════════
          PRICING + CALCULATOR
      ════════════════════════════════════════ */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-14">
            <h2 className="text-4xl text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Simple, honest pricing
            </h2>
            <p className="text-slate-500 text-lg">One plan. Everything included. Pay per facility.</p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Pricing card */}
            <RevealOnScroll className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white overflow-hidden shadow-2xl shadow-blue-100">
              <div className="bg-blue-700 px-8 py-8 text-center">
                <div className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-3">Per Facility</div>
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="text-7xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>$149</span>
                  <div className="text-blue-200 text-base mb-3 text-left leading-snug">/facility<br />/month</div>
                </div>
                <p className="text-blue-200 text-sm max-w-xs mx-auto">
                  Each facility is $149/month — no tiers, no per-watch fees, no surprises.
                </p>
              </div>
              <div className="px-8 py-8">
                <div className="grid grid-cols-1 gap-y-2.5 mb-8">
                  {includedFeatures.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</div>
                      <span className="text-slate-700 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/signup"
                  className="block text-center py-4 px-8 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                >
                  Start 14-Day Free Trial →
                </Link>
                <p className="text-center text-slate-500 text-xs mt-3">
                  Cancel any time · No setup fees
                </p>
              </div>
            </RevealOnScroll>

            {/* Cost calculator */}
            <RevealOnScroll delay={150}>
              <CostCalculator />
              <p className="text-slate-500 text-sm text-center mt-6">
                One CMS immediate jeopardy finding costs{' '}
                <span className="font-semibold text-slate-700">$21,393/day</span>.
                DutyProof costs <span className="font-semibold text-slate-700">$149/month</span>.
              </p>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          NOT A CARE FACILITY — subtle link
      ════════════════════════════════════════ */}
      <div className="bg-white border-t border-slate-100 py-5">
        <p className="text-center text-slate-400 text-sm">
          Not a care facility?{' '}
          <Link href="/industries" className="text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors">
            DutyProof works anywhere a fire watch is required →
          </Link>
        </p>
      </div>

      {/* ════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-950 py-32">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div aria-hidden className="glow-pulse pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-20" style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }} />

        <RevealOnScroll className="relative max-w-2xl mx-auto px-6 text-center">
          <div className="text-blue-500 text-xs font-bold tracking-widest uppercase mb-6">Don&apos;t wait until Monday</div>
          <h2
            className="text-6xl text-white mb-6 leading-[0.95]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            When the inspector<br />walks in, you&apos;ll<br />be ready.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-4">
            Set up your first fire watch in under two minutes. No setup fees.
          </p>
          <p className="text-slate-400 text-sm mb-10">
            Then $149/facility/month — less than 10 minutes of a CMS penalty day.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-9 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg shadow-2xl shadow-blue-900/60 transition-all hover:-translate-y-0.5"
          >
            Start 14-Day Free Trial →
          </Link>
          <p className="mt-4 text-slate-500 text-xs">
            14-day free trial · No setup fees · Cancel any time before trial ends — no charge
          </p>
          <p className="mt-3 text-slate-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-2">Sign in</Link>
          </p>
        </RevealOnScroll>
      </section>
    </>
  )
}
