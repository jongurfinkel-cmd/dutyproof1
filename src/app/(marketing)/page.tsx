import Link from 'next/link'
import RevealOnScroll from '@/components/RevealOnScroll'
import FaqAccordion from '@/components/FaqAccordion'
import StickyCTA from '@/components/StickyCTA'
import SocialProof from '@/components/SocialProof'
import InteractiveDemo from '@/components/InteractiveDemo'

export const metadata = {
  title: 'Fire Watch Compliance Software for Contractors',
  description:
    'Stop pencil-whipping your fire watch logs. DutyProof automates check-in verification every 15–30 min, alerts supervisors in under 60 seconds on a miss, and generates one-click OSHA-ready PDF audit reports. $199/mo flat rate — unlimited sites.',
  keywords: [
    'fire watch verification software',
    'hot work fire watch software',
    'OSHA fire watch compliance',
    'NFPA 51B fire watch',
    'welding fire watch log software',
    'fire watch check-in software',
    'contractor fire watch documentation',
    'hot work permit fire watch',
    'mechanical contractor fire watch',
    'fire watch audit log software',
  ],
  openGraph: {
    title: 'DutyProof — Stop Pencil-Whipping Your Fire Watch Logs',
    description:
      'Automated check-in verification, missed-check-in alerts in under 60 seconds, and one-click OSHA-ready PDF reports. $199/mo flat rate for hot work contractors.',
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
      'Automated check-in verification, missed-check-in alerts in under 60 seconds, and one-click OSHA-ready PDF reports. $199/mo flat rate.',
  },
}


const includedFeatures = [
  'Run as many watches as you need — no extra charge',
  'Workers get a check-in link every 15 or 30 min — they tap to verify',
  'Every check-in shows where your guy was standing',
  'Works even when there\'s no cell service on site',
  'If someone misses a check-in, your super knows in under 60 seconds',
  'Supervisors tap to confirm they saw the alert — that gets logged too',
  'Pre-watch safety checklist with photos before the torch lights',
  'Records can\'t be edited or deleted — ever',
  'One click to download a PDF you can hand to any inspector',
  'Add as many admins and supers as you want',
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
      'Fire watch verification platform for hot work contractors. Automated check-in links, tamper-proof audit logs, and OSHA-ready PDF reports for welding, pipefitting, and mechanical contractors.',
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
      'Automated fire watch check-in verification',
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
        acceptedAnswer: { '@type': 'Answer', text: '$199 per month, flat rate. Unlimited job sites. No per-watch fees, no per-user fees, no setup costs. Cancel any time — 30-day money-back guarantee.' },
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
        name: 'What does the fire watch worker need?',
        acceptedAnswer: { '@type': 'Answer', text: 'Any smartphone with a web browser — no app to download, no login required. DutyProof generates a secure check-in link at each interval; the worker taps it and the check-in is recorded with a server-side timestamp and GPS coordinates. Links can be delivered via optional SMS, shared manually, or accessed from the dashboard.' },
      },
      {
        '@type': 'Question',
        name: 'What if the job site has no cell service?',
        acceptedAnswer: { '@type': 'Answer', text: 'DutyProof works offline. If the worker opened the check-in link before losing signal, they can still tap CHECK IN NOW. The check-in saves to their phone with the device timestamp and GPS, then syncs automatically when connectivity returns. No false misses.' },
      },
      {
        '@type': 'Question',
        name: 'What if my worker doesn\'t check in on time?',
        acceptedAnswer: { '@type': 'Answer', text: 'DutyProof automatically marks the check-in as missed and alerts your supervisor within 60 seconds — with a tap-to-acknowledge link. The supervisor taps it to confirm they saw the alert. Both the miss and the acknowledgment are permanently recorded in the audit trail. Alerts can be delivered via dashboard notification or optional SMS.' },
      },
      {
        '@type': 'Question',
        name: 'Is there a contract or long-term commitment?',
        acceptedAnswer: { '@type': 'Answer', text: 'No contracts. $199/month, cancel any time from your account settings — no questions asked, no cancellation fee. Records retained for the life of your account.' },
      },
    ],
  },
]

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow moved into InteractiveDemo for phase-reactive color */}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 lg:pt-12 pb-8 lg:pb-12">
          <div className="fade-up">
            <InteractiveDemo />
          </div>
        </div>
      </section>

      <div id="sticky-sentinel" />

      {/* ════════════════════════════════════════
          TRUST STRIP + STATS
      ════════════════════════════════════════ */}
      <div className="bg-slate-900 border-b border-slate-800 py-3 overflow-hidden">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-6">
          {([
            'All your sites, one price',
            'Meets OSHA fire watch requirements',
            'NFPA 51B ready',
            'Works without cell service',
            'No app to install',
          ] as const).map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-medium whitespace-nowrap">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          THE MOMENT — hot work narrative
      ════════════════════════════════════════ */}
      <section id="the-moment" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          {/* NFPA stats — set up the fear */}
          <RevealOnScroll className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {([
                { n: '4,630', l: 'structure fires per year caused by hot work', s: 'NFPA', href: 'https://www.nfpa.org/education-and-research/research/nfpa-research/fire-statistical-reports/structure-fires-started-by-hot-work', highlight: false },
                { n: '$355M', l: 'in property damage every year', s: 'NFPA', href: 'https://www.nfpa.org/education-and-research/research/nfpa-research/fire-statistical-reports/structure-fires-started-by-hot-work', highlight: true },
                { n: '48 min', l: 'avg time before a post-weld fire ignites', s: 'NFPA 51B', href: 'https://www.nfpa.org/codes-and-standards/nfpa-51b-standard-development/51b', highlight: false },
              ] as const).map((stat) => (
                <div key={stat.n} className={`text-center p-4 rounded-xl ${stat.highlight ? 'bg-red-50 border-2 border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
                  <div className={`text-2xl sm:text-3xl font-black leading-none mb-1 ${stat.highlight ? 'text-red-600' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-display)' }}>{stat.n}</div>
                  <div className={`text-xs leading-snug ${stat.highlight ? 'text-red-600' : 'text-slate-500'}`}>{stat.l}</div>
                  <a href={stat.href} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 text-[9px] mt-1 inline-block transition-colors">{stat.s} ↗</a>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="text-center mb-16">
            <h2
              className="text-2xl sm:text-4xl lg:text-5xl text-slate-900 max-w-3xl mx-auto leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              The fire started at 7 PM.<br />The hot work finished at 3 PM.<br />What can you prove?
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={150} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
            {/* Without DutyProof */}
            <div className="rounded-2xl bg-red-950/5 border-2 border-red-200 p-8 moment-card">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold tracking-wide mb-6 uppercase">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Without DutyProof
              </div>
              <div className="space-y-4 text-slate-600 text-base leading-relaxed">
                <p>
                  Your welder finished at 3 PM. Fire watch says he stayed. Nobody verified. Now the fire marshal wants documentation.
                </p>
                <p>
                  You hand them a paper log — handwritten times, no GPS, no proof anyone was there. Claim disputed. Litigation begins.
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

            {/* Time connector — desktop */}
            <div className="hidden md:flex flex-col items-center justify-center gap-2 py-12" aria-hidden="true">
              <div className="w-px flex-1 bg-gradient-to-b from-red-200 to-slate-200" />
              <div className="px-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold whitespace-nowrap">
                4 hours later
              </div>
              <div className="w-px flex-1 bg-gradient-to-b from-slate-200 to-blue-200" />
            </div>
            {/* Time connector — mobile */}
            <div className="flex md:hidden items-center justify-center gap-3 py-2" aria-hidden="true">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200" />
              <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold whitespace-nowrap">
                4 hours later
              </div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200" />
            </div>

            {/* With DutyProof */}
            <div className="rounded-2xl bg-blue-950/5 border-2 border-blue-200 p-8 moment-card">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wide mb-6 uppercase">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                With DutyProof
              </div>
              <div className="space-y-4 text-slate-600 text-base leading-relaxed">
                <p>
                  Fire marshal asks for records. You pull up the app, hit Download. PDF in hand in under 60 seconds.
                </p>
                <p>
                  Every check-in shows where your guy was and when. The record can&apos;t be changed after the fact. Inquiry closed.
                </p>
              </div>
              <div className="mt-7 p-5 rounded-xl bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div className="text-green-700 font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>Under 60 seconds.</div>
                </div>
                <div className="text-blue-700 text-sm font-medium pl-11">PDF generated. Fire marshal satisfied. Claim supported.</div>
              </div>
            </div>
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
              {(['No per-user fees', 'No setup costs', 'Cancel any time'] as const).map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                  {item}
                </span>
              ))}
            </div>
            <h2 className="text-2xl sm:text-4xl text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Simple, honest pricing
            </h2>
            <p className="text-slate-500 text-lg">One price. Everything included. No surprises.</p>
          </RevealOnScroll>

          {/* Pricing card — single plan */}
          <div className="max-w-lg mx-auto mb-8">
            <RevealOnScroll className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white overflow-hidden shadow-2xl shadow-blue-100 relative">
              <div className="bg-blue-700 px-4 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8 text-center relative">
                <div className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-3">Flat Rate — Unlimited Sites</div>
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>$199</span>
                  <div className="text-blue-200 text-base mb-3 text-left leading-snug">/month</div>
                </div>
                <p className="text-blue-200 text-sm max-w-xs mx-auto">
                  Cover all your job sites. Run as many watches as you need. No surprises on the bill.
                </p>
              </div>
              <div className="px-4 py-6 sm:px-8 sm:py-8">
                <div className="grid grid-cols-1 gap-y-2.5 mb-8">
                  {includedFeatures.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
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
                  30-day money-back guarantee · No setup fees · Cancel any time
                </p>
              </div>
            </RevealOnScroll>
          </div>

          {/* PDF report preview card */}
          <RevealOnScroll className="mb-8">
            <div className="max-w-md mx-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-slate-900 font-bold text-sm mb-2">What the inspector gets</div>
                  <ul className="space-y-1.5 text-slate-500 text-xs">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />Map showing where every check-in happened</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />Exact times — can&apos;t be changed after the fact</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />Any missed rounds and how fast your super responded</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />Print it or email it — takes one click</li>
                  </ul>
                  <a
                    href="/sample-report.pdf"
                    download
                    className="inline-flex items-center gap-1.5 mt-3 text-blue-600 hover:text-blue-700 text-xs font-semibold transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Sample Report (PDF)
                  </a>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* AHJ disclaimer */}
          <p className="text-center text-slate-400 text-xs max-w-2xl mx-auto">
            DutyProof supports fire watch verification workflows. Each contractor remains responsible for compliance with local AHJ, OSHA, and applicable fire code requirements.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ
      ════════════════════════════════════════ */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-12">
            <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">FAQ</div>
            <h2
              className="text-2xl sm:text-4xl text-slate-900"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Answers before you ask
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <FaqAccordion />
          </RevealOnScroll>
          <RevealOnScroll delay={200} className="text-center mt-12 pt-8 border-t border-slate-200">
            <p className="text-slate-500 text-sm mb-4">Still have questions?{' '}
              <Link href="/support/walkthrough" className="text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors">Contact our team</Link>
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
          <div className="text-orange-500 text-xs font-bold tracking-widest uppercase mb-6">Built for the trades</div>
          <h2
            className="text-3xl sm:text-5xl lg:text-6xl text-white mb-6 leading-[0.95]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            When someone asks<br />&ldquo;where&apos;s the <span className="text-transparent bg-clip-text hero-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, #60a5fa, #93c5fd, #60a5fa, #93c5fd, #60a5fa)' }}>proof</span>?&rdquo;<br />you&apos;ll have it.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-slate-400 text-lg mb-8">
            <span>Location tracked</span>
            <span className="text-slate-600" aria-hidden="true">/</span>
            <span>Time stamped</span>
            <span className="text-slate-600" aria-hidden="true">/</span>
            <span className="text-white font-semibold">Every round documented</span>
          </div>

          {/* Mission */}
          <div className="max-w-lg mx-auto mb-10 rounded-xl bg-white/[0.03] border border-white/[0.07] p-6 text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z" fill="#fb923c" />
                  <path d="M12 8c0 2-2 3-2 5a2 2 0 0 0 4 0c0-2-2-3-2-5z" fill="#fbbf24" />
                </svg>
              </div>
              <div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  We talked to over 100 contractors about how fire watch actually works on the job.
                  Not one said the paperwork side is handled. That&apos;s why we built this.
                </p>
              </div>
            </div>
          </div>

          {/* Setup steps */}
          <div className="flex items-start justify-center gap-0 mb-10 max-w-lg mx-auto">
            {([
              { step: '1', label: 'Sign up' },
              { step: '2', label: 'Add your site' },
              { step: '3', label: 'Start watch' },
            ] as const).map((s, i) => (
              <div key={s.step} className="flex items-start">
                <div className="flex flex-col items-center gap-2 w-20 sm:w-24">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 2 ? 'bg-green-500/20 border border-green-500/40 text-green-400' : 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                  }`}>{s.step}</div>
                  <span className="text-slate-300 text-xs font-medium text-center">{s.label}</span>
                </div>
                {i < 2 && (
                  <div className="flex items-center pt-3.5" aria-hidden="true">
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="text-slate-600 flex-shrink-0">
                      <path d="M0 6h16m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="cta-pulse inline-flex items-center justify-center gap-2 px-9 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg shadow-2xl shadow-blue-900/60 transition-all hover:-translate-y-0.5"
            >
              Get Started — $199/mo →
            </Link>
          </div>
          <p className="mt-4 text-slate-400 text-sm">
            $199/mo, unlimited sites · 30-day money-back guarantee · Cancel any time
          </p>
          <p className="mt-3 text-slate-500 text-xs">
            Dedicated onboarding included.{' '}
            <Link href="/support/walkthrough" className="text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-2">Request a walkthrough</Link>
            {' · '}
            <Link href="/login" className="text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-2">Sign in</Link>
          </p>
        </RevealOnScroll>
      </section>

      {/* ── Not a contractor? ── */}
      <div className="bg-slate-900 border-t border-slate-700/50 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
          <p className="text-slate-400 text-sm font-medium">Not a contractor?</p>
          <Link href="/industries" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.15] text-sm font-medium transition-all">
            DutyProof works anywhere a fire watch is required
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Link>
        </div>
      </div>

      <StickyCTA />
    </>
  )
}
