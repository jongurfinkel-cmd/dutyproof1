import Link from 'next/link'
import RevealOnScroll from '@/components/RevealOnScroll'
import FeatureTabs from '@/components/FeatureTabs'
import FaqAccordion from '@/components/FaqAccordion'
import CostCalculator from '@/components/CostCalculator'
import HeroProduct from '@/components/HeroProduct'
import StickyCTA from '@/components/StickyCTA'
import SocialProof from '@/components/SocialProof'

export const metadata = {
  title: 'Fire Watch Compliance Software for Contractors',
  description:
    'Stop pencil-whipping your fire watch logs. DutyProof sends automated SMS check-ins every 15–30 min, alerts supervisors in under 60 seconds on a miss, and generates one-click OSHA-ready PDF audit reports. $199/mo flat rate — unlimited sites.',
  keywords: [
    'fire watch verification software',
    'hot work fire watch software',
    'OSHA fire watch compliance',
    'NFPA 51B fire watch',
    'welding fire watch log software',
    'fire watch SMS check-in',
    'contractor fire watch documentation',
    'hot work permit fire watch',
    'mechanical contractor fire watch',
    'fire watch audit log software',
  ],
  openGraph: {
    title: 'DutyProof — Stop Pencil-Whipping Your Fire Watch Logs',
    description:
      'Automated SMS check-ins, missed-check-in alerts in under 60 seconds, and one-click OSHA-ready PDF reports. $199/mo flat rate for hot work contractors.',
    url: 'https://dutyproof.com',
    siteName: 'DutyProof',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'DutyProof — Fire Watch Verification Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DutyProof — Stop Pencil-Whipping Your Fire Watch Logs',
    description:
      'Automated SMS check-ins, missed-check-in alerts in under 60 seconds, and one-click OSHA-ready PDF reports. $199/mo flat rate.',
  },
}

const timelineItems = [
  { time: '08:00 AM', status: 'completed',    label: 'Checked in', detail: 'GPS 34.0521°N · SMS confirmed', delay: '0.1s' },
  { time: '08:30 AM', status: 'completed',    label: 'Checked in', detail: 'GPS 34.0519°N · SMS confirmed', delay: '0.5s' },
  { time: '09:00 AM', status: 'missed',       label: 'MISSED — Alert sent to supervisor', detail: 'SMS escalation fired · 47 sec elapsed', delay: '0.9s' },
  { time: '09:03 AM', status: 'acknowledged', label: 'Supervisor acknowledged', detail: 'T. Okafor · GPS 34.0518°N · 3 min response', delay: '1.1s' },
  { time: '09:30 AM', status: 'completed',    label: 'Checked in (offline → synced)', detail: 'Device time 09:30:08 · synced at 09:31 · GPS verified', delay: '1.5s' },
  { time: '10:00 AM', status: 'pending',      label: 'Pending · due in 8 min', detail: 'SMS delivered · awaiting tap', delay: '1.9s' },
]

const includedFeatures = [
  'Unlimited active watches per job site',
  'Automated SMS check-ins (15 or 30 min intervals)',
  'GPS location capture on every check-in',
  'Offline check-ins — works without signal',
  'Missed check-in escalation in < 60 seconds',
  'Supervisor acknowledgment with GPS logging',
  'Pre-watch safety checklists with photo capture',
  'Tamper-proof immutable audit log with full search',
  'One-click OSHA-ready PDF reports with GPS maps',
  'Unlimited admin & supervisor accounts',
]

const FACILITY_TYPES = [
  'Mechanical Contractors',
  'Welding Shops & Fabricators',
  'Pipefitters & Steamfitters',
  'General Contractors',
  'Oil & Gas Operations',
  'HVAC & Plumbing Contractors',
]

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DutyProof',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://dutyproof.com',
    description:
      'Fire watch verification platform for hot work contractors. SMS check-ins, tamper-proof audit logs, and OSHA-ready PDF reports for welding, pipefitting, and mechanical contractors.',
    offers: {
      '@type': 'Offer',
      price: '199',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '199',
        priceCurrency: 'USD',
        unitText: 'per month',
      },
    },
    featureList: [
      'Automated SMS fire watch check-ins',
      'Offline check-ins — works without signal',
      'Missed check-in escalation in under 60 seconds',
      'Supervisor acknowledgment with GPS logging',
      'Tamper-proof immutable audit log',
      'OSHA-ready PDF compliance reports with GPS maps',
      'Unlimited job sites and active watches',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DutyProof',
    url: 'https://dutyproof.com',
    logo: 'https://dutyproof.com/icon.svg',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@dutyproof.com',
      contactType: 'customer support',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does DutyProof cost?',
        acceptedAnswer: { '@type': 'Answer', text: '$199 per month, flat rate. Unlimited job sites. No per-watch fees, no per-user fees, no setup costs. Annual option available at $2,399/year.' },
      },
      {
        '@type': 'Question',
        name: 'Does DutyProof meet OSHA hot work fire watch requirements?',
        acceptedAnswer: { '@type': 'Answer', text: 'DutyProof generates GPS-verified, server-timestamped, carrier-confirmed records for every check-in — exactly the kind of documentation OSHA inspectors, fire marshals, and insurance adjusters need when auditing hot work fire watch compliance.' },
      },
      {
        '@type': 'Question',
        name: 'What check-in interval is required for a hot work fire watch?',
        acceptedAnswer: { '@type': 'Answer', text: 'OSHA 29 CFR 1910.252 and NFPA 51B require a fire watch during and for at least 30 minutes after hot work. Most contractors run check-ins every 15–30 minutes. DutyProof supports any interval you configure.' },
      },
      {
        '@type': 'Question',
        name: 'What happens when an OSHA inspector or fire marshal asks for our records?',
        acceptedAnswer: { '@type': 'Answer', text: 'Open DutyProof, go to Watch History, find the watch in question, and click Download Report. In under 60 seconds you have a print-ready PDF with every check-in, GPS coordinate, missed check-in alert, and timestamp.' },
      },
      {
        '@type': 'Question',
        name: 'Can I run multiple simultaneous watches on the same job site?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. You can run multiple concurrent watches — one per work area, floor, or welding bay — each with its own assigned worker, check-in interval, and audit trail. One subscription covers all active watches.' },
      },
      {
        '@type': 'Question',
        name: 'What phone does the fire watch worker need?',
        acceptedAnswer: { '@type': 'Answer', text: 'Any phone that can receive a text message — no app to download, no login required. DutyProof sends a secure SMS link at each interval; the worker taps it and the check-in is recorded with a server-side timestamp and GPS coordinates.' },
      },
      {
        '@type': 'Question',
        name: 'What if the job site has no cell service?',
        acceptedAnswer: { '@type': 'Answer', text: 'DutyProof works offline. If the worker opened the check-in link before losing signal, they can still tap CHECK IN NOW. The check-in saves to their phone with the device timestamp and GPS, then syncs automatically when connectivity returns. No false misses.' },
      },
      {
        '@type': 'Question',
        name: 'What if my worker doesn\'t check in on time?',
        acceptedAnswer: { '@type': 'Answer', text: 'DutyProof automatically marks the check-in as missed and fires an SMS alert to your supervisor within 60 seconds — with a tap-to-acknowledge link. The supervisor taps it to confirm they saw the alert. Both the miss and the acknowledgment are permanently recorded in the audit trail.' },
      },
      {
        '@type': 'Question',
        name: 'Is there a contract or long-term commitment?',
        acceptedAnswer: { '@type': 'Answer', text: 'No contracts on the monthly plan. $199/month, cancel any time. Annual plans are billed once at $2,399/year. Records retained for the life of your account.' },
      },
    ],
  },
]

export default function LandingPage() {
  const tickerItems = [...FACILITY_TYPES, ...FACILITY_TYPES]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-20">

            {/* ── Copy ── */}
            <div className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none lg:pt-4">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-300 text-sm font-bold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 live-dot" />
                  Built by a Firefighter
                </div>
              </div>

              <h1
                className="text-3xl sm:text-5xl lg:text-[6.5rem] text-white leading-[0.9] tracking-tight mb-8"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                Stop pencil-<br />
                whipping<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-amber-300 to-yellow-300">
                  your logs.
                </span>
              </h1>

              <p className="text-slate-300 text-xl leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
                Most hot work fires start after the welder leaves.
                Your fire watch either happened — or it didn&apos;t.
                DutyProof makes sure you can prove it.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-8">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-base shadow-xl shadow-blue-900/50 transition-all hover:-translate-y-0.5 hover:shadow-blue-700/60"
                >
                  Get Started — $199/mo →
                </Link>
                <Link
                  href="/#the-moment"
                  className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors underline underline-offset-4 decoration-slate-700 hover:decoration-slate-500"
                >
                  See how it works ↓
                </Link>
              </div>

              <p className="text-slate-500 text-xs mb-8 text-center lg:text-left">
                30-day money-back guarantee — no questions asked.{' '}
                <a href="mailto:jon@dutyproof.com" className="text-slate-400 hover:text-white transition-colors underline underline-offset-2">Questions? Email us.</a>
              </p>

              {/* ── Risk stats strip — sourced from NFPA ── */}
              <div className="mt-8 pt-6 border-t border-white/[0.07] grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
                {([
                  {
                    n: '3,400+',
                    l: 'hot work fires per year in the US',
                    s: 'NFPA Hot Work Report',
                    href: 'https://www.nfpa.org/education-and-research/research/nfpa-research/fire-statistical-reports/hot-work',
                    highlight: false,
                  },
                  {
                    n: '63%',
                    l: 'of hot work fires — no fire watch was present',
                    s: 'NFPA 51B / Hot Work Data',
                    href: 'https://www.nfpa.org/codes-and-standards/nfpa-51b-standard-development/51b',
                    highlight: false,
                  },
                  {
                    n: '48 min',
                    l: 'average time before a post-weld fire ignites — after the welder has left',
                    s: 'NFPA 51B / Hot Work Data',
                    href: 'https://www.nfpa.org/codes-and-standards/nfpa-51b-standard-development/51b',
                    highlight: true,
                  },
                ] as const).map(s => (
                  <div key={s.n} className={`text-center lg:text-left ${s.highlight ? 'rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3 -mx-2' : ''}`}>
                    <div className={`font-black leading-none mb-1.5 ${s.highlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300' : 'text-white'}`} style={{ fontFamily: 'var(--font-display)', fontSize: s.highlight ? '2rem' : '1.75rem' }}>{s.n}</div>
                    <div className={`text-xs leading-snug ${s.highlight ? 'text-orange-300/70' : 'text-slate-400'}`}>{s.l}</div>
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

      <div id="sticky-sentinel" />

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
          THE MOMENT — hot work narrative
      ════════════════════════════════════════ */}
      <section id="the-moment" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-16">
            <h2
              className="text-2xl sm:text-4xl lg:text-5xl text-slate-900 max-w-3xl mx-auto leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              The fire started at 7 PM.<br />The hot work finished at 3 PM.<br />What can you prove?
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
                  Your welder finished at 3 PM. Your fire watch says he stayed the full post-weld period. Nobody verified that. Now the fire marshal wants documentation.
                </p>
                <p>
                  You hand them a paper log — handwritten times, no GPS, no proof anyone was actually there. The claim is disputed. Litigation begins. Your premium goes up.
                </p>
              </div>
              <div className="mt-7 p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="text-red-700 font-bold text-lg">$292,000</div>
                <div className="text-red-600 text-sm">average property damage per hot work fire</div>
                <a
                  href="https://www.nfpa.org/education-and-research/research/nfpa-research/fire-statistical-reports/hot-work"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-600 text-[9px] mt-1 inline-block transition-colors"
                >
                  NFPA Hot Work Fire Hazards Report ↗
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
                  The fire marshal asks for your fire watch records.
                  You open a browser, click Download Report, and hand them a PDF in under 60 seconds.
                </p>
                <p>
                  Every check-in GPS-verified, server-timestamped, and carrier-confirmed.
                  Continuous coverage documented from the moment the torch went out.
                  Immutable — it says exactly what happened and when.
                </p>
                <p>
                  Your documentation speaks for itself. Inquiry closed.
                </p>
              </div>
              <div className="mt-7 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="text-blue-700 font-bold text-lg">Same day.</div>
                <div className="text-blue-600 text-sm">Fire marshal satisfied. Insurance claim supported.</div>
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
                className="text-2xl sm:text-4xl lg:text-5xl text-slate-900 leading-tight mb-5"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                An immutable audit trail,<br />building in real time.
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-5">
                Every check-in is written once and locked — no edits, no deletions, no backdating.
                Each row captures a server-side timestamp, location data, and a carrier-confirmed SMS delivery receipt.
              </p>
              <p className="text-slate-500 text-base leading-relaxed">
                Missed a check-in? An alert fires to your supervisor within 60 seconds — with a tap-to-acknowledge link.
                The miss, the alert, and the supervisor&apos;s response are all recorded permanently.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={100} className="flex-shrink-0 w-full max-w-md timeline-trigger">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Ace Mechanical — Building D Weld</div>
                    <div className="text-slate-500 text-xs mt-0.5">M. Rivera · 30 min · started 5h ago</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600 text-sm font-bold">4 of 5</div>
                    <div className="text-slate-400 text-[10px]">on time</div>
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
                        row.status === 'completed'    ? 'bg-green-100 text-green-700' :
                        row.status === 'missed'       ? 'bg-red-100 text-red-600' :
                        row.status === 'acknowledged' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-400'
                      }`}>
                        {row.status === 'completed' ? '✓' : row.status === 'missed' ? '✕' : row.status === 'acknowledged' ? '✓' : '…'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[10px] font-mono shrink-0">{row.time}</span>
                          <span className={`text-xs font-semibold truncate ${
                            row.status === 'completed'    ? 'text-slate-800' :
                            row.status === 'missed'       ? 'text-red-600' :
                            row.status === 'acknowledged' ? 'text-amber-700' :
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
                <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Write-once · server timestamps · no edits, no deletions</span>
                  <Link href="/security" className="underline underline-offset-2 hover:text-slate-600 transition-colors whitespace-nowrap">How we protect records →</Link>
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
            <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">Platform</div>
            <h2
              className="text-2xl sm:text-4xl lg:text-5xl text-slate-900 leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Built for the way hot work<br />contractors actually operate.
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <FeatureTabs />
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════════════════════════════════
          WHAT CONTRACTORS TOLD US
      ════════════════════════════════════════ */}
      <SocialProof />

      {/* ════════════════════════════════════════
          PRICING + CALCULATOR
      ════════════════════════════════════════ */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-14">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-400 font-medium mb-10">
              <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-slate-300" />Write-once immutable audit log</span>
              <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-slate-300" />OSHA 29 CFR 1910.252 aligned</span>
              <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-slate-300" />30-day money-back guarantee</span>
            </div>
            <h2 className="text-2xl sm:text-4xl text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Simple, honest pricing
            </h2>
            <p className="text-slate-500 text-lg">Start self-serve. Scale with us.</p>
            <a
              href="/sample-report.pdf"
              download
              className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 text-sm font-semibold underline underline-offset-2 transition-colors"
            >
              ↓ Download a sample compliance report
            </a>
          </RevealOnScroll>

          {/* ROI calculator — value anchoring before the cards */}
          <RevealOnScroll className="mb-16">
            <CostCalculator />
          </RevealOnScroll>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Single facility card */}
            <RevealOnScroll className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white overflow-hidden shadow-2xl shadow-blue-100">
              <div className="bg-blue-700 px-4 py-6 sm:px-8 sm:py-8 text-center">
                <div className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-3">Flat Rate — Unlimited Sites</div>
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>$199</span>
                  <div className="text-blue-200 text-base mb-3 text-left leading-snug">/month</div>
                </div>
                <p className="text-blue-200 text-sm max-w-xs mx-auto">
                  Unlimited job sites. Unlimited watches. No per-user fees. No surprises.
                </p>
              </div>
              <div className="px-4 py-6 sm:px-8 sm:py-8">
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
                  Start Your First Watch →
                </Link>
                <p className="text-center text-slate-500 text-xs mt-3">
                  30-day money-back guarantee · No setup fees · Annual option: $2,399/yr
                </p>
              </div>
            </RevealOnScroll>

            {/* Annual / GC Enterprise card */}
            <RevealOnScroll delay={100} className="rounded-3xl border-2 border-green-200 bg-gradient-to-b from-green-50 to-white overflow-hidden shadow-xl relative">
              <div className="bg-green-700 px-4 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8 text-center relative">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg z-10">
                  Lock in your rate
                </div>
                <div className="text-green-200 text-xs font-bold tracking-widest uppercase mb-3">Annual Commitment</div>
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="text-4xl sm:text-6xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>$2,399</span>
                  <div className="text-green-200 text-base mb-3">/year</div>
                </div>
                <p className="text-green-200 text-sm max-w-xs mx-auto">
                  Same unlimited plan. One bill, locked rate for 12 months.
                </p>
              </div>
              <div className="px-4 py-6 sm:px-8 sm:py-8">
                <div className="grid grid-cols-1 gap-y-2.5 mb-8">
                  {[
                    'Everything in the monthly plan',
                    'Locked rate — no price increases for 12 months',
                    'Priority email & phone support',
                    'Dedicated onboarding assistance',
                    'Annual compliance summary report',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</div>
                      <span className="text-slate-700 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/signup"
                  className="block text-center py-4 px-8 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold text-base shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Start Annual Plan →
                </Link>
                <p className="text-center text-slate-500 text-xs mt-3">
                  Billed annually · Cancel any time
                </p>
              </div>
            </RevealOnScroll>
          </div>

          {/* AHJ disclaimer */}
          <p className="text-center text-slate-400 text-xs max-w-2xl mx-auto">
            DutyProof supports fire watch verification workflows. Each contractor remains responsible for compliance with local AHJ, OSHA, and applicable fire code requirements.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ
      ════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-12">
            <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">Common questions</div>
            <h2
              className="text-2xl sm:text-4xl text-slate-900"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Questions contractors ask
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <FaqAccordion />
          </RevealOnScroll>
          <RevealOnScroll delay={200} className="text-center mt-12 pt-8 border-t border-slate-200">
            <p className="text-slate-500 text-sm mb-4">Still have questions?{' '}
              <a href="mailto:jon@dutyproof.com" className="text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors">Email us</a>
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              Get Started — $199/mo →
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-950 py-16 lg:py-32">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div aria-hidden className="glow-pulse pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-20" style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }} />

        <RevealOnScroll className="relative max-w-2xl mx-auto px-6 text-center">
          <div className="text-orange-500 text-xs font-bold tracking-widest uppercase mb-6">Stop pencil-whipping</div>
          <h2
            className="text-3xl sm:text-5xl lg:text-6xl text-white mb-6 leading-[0.95]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            When the fire marshal<br />walks in, you&apos;ll<br />be ready.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-4">
            Set up your first watch in under two minutes. $199/mo, unlimited sites.
          </p>
          <p className="text-slate-400 text-sm mb-10">
            If it&apos;s not for you, cancel in 30 days for a full refund. No questions asked.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-9 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg shadow-2xl shadow-blue-900/60 transition-all hover:-translate-y-0.5"
            >
              Get Started — $199/mo →
            </Link>
          </div>
          <p className="mt-4 text-slate-500 text-xs">
            30-day money-back guarantee · Cancel any time · $2,399/yr annual option
          </p>
          <p className="mt-2 text-slate-600 text-xs">
            Want a walkthrough first?{' '}
            <a href="mailto:jon@dutyproof.com?subject=DutyProof%20Demo" className="text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-2">Email jon@dutyproof.com</a>
          </p>
          <p className="mt-3 text-slate-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-2">Sign in</Link>
          </p>
        </RevealOnScroll>
      </section>

      {/* ── Not a contractor? ── */}
      <div className="bg-slate-900 border-t border-slate-700 py-5">
        <p className="text-center text-slate-400 text-sm">
          Not a contractor?{' '}
          <Link href="/industries" className="text-slate-300 hover:text-white underline underline-offset-2 transition-colors">
            DutyProof works anywhere a fire watch is required →
          </Link>
        </p>
      </div>

      <StickyCTA />
    </>
  )
}
