import Link from 'next/link'
import RevealOnScroll from '@/components/RevealOnScroll'

export const metadata = {
  title: 'Industries — DutyProof Fire Watch Compliance',
  description:
    'DutyProof works anywhere NFPA 101 requires a fire watch. Hotels, warehouses, schools, offices, construction sites, retail, and more — one platform, any building type.',
}

const industries = [
  {
    icon: '🏨',
    name: 'Hotels & Hospitality',
    trigger: 'A fire alarm system offline during a renovation or system upgrade triggers an immediate watch requirement — with guests on every floor.',
    stakes: 'Brand damage, liability exposure, and AHJ citations if documentation is insufficient.',
  },
  {
    icon: '🏭',
    name: 'Warehouses & Distribution Centers',
    trigger: 'Sprinkler system impairment for maintenance or cold-pipe repair forces a watch across thousands of square feet.',
    stakes: 'Insurance requirements often mandate written logs. No log = no coverage.',
  },
  {
    icon: '🏫',
    name: 'Schools & Universities',
    trigger: 'Any fire alarm or suppression system taken offline for testing, upgrade, or repair.',
    stakes: 'State fire marshal audits. Occupation certificates. Board liability. Parental scrutiny.',
  },
  {
    icon: '🏢',
    name: 'Office Buildings & Commercial Towers',
    trigger: 'Tenant fit-outs, HVAC tie-ins, and system upgrades routinely take alarm systems offline.',
    stakes: 'Property management firms need documentation chains across multiple tenants and floors.',
  },
  {
    icon: '⚙️',
    name: 'Manufacturing & Industrial Facilities',
    trigger: 'Sprinkler impairments for equipment relocation, welding work, or pipe freeze protection.',
    stakes: 'OSHA 29 CFR 1910.159 and insurance audits require written records. Verbal logs don\'t hold up.',
  },
  {
    icon: '🏗️',
    name: 'Construction Sites',
    trigger: 'Temporary structures, hot work operations, and buildings under construction before suppression systems are active.',
    stakes: 'GC liability. AHJ inspection holds. Project delays when documentation can\'t be produced.',
  },
  {
    icon: '🛍️',
    name: 'Retail & Shopping Centers',
    trigger: 'Anchor tenant renovations, common-area suppression work, or system testing during off-hours.',
    stakes: 'Fire marshal closures cost thousands per hour. Paper logs don\'t survive an audit.',
  },
  {
    icon: '🏥',
    name: 'Hospitals & Healthcare',
    trigger: 'Joint Commission and CMS surveys require comprehensive fire safety documentation. Any system impairment triggers strict watch protocols.',
    stakes: 'Accreditation findings, CMS certification risk, and immediate jeopardy designations.',
  },
]

export default function IndustriesPage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* ── Hero ── */}
      <section className="bg-slate-950 py-24 relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-20"
          style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }}
        />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold tracking-widest mb-8 uppercase">
            NFPA 101 §9.6.1.6
          </div>
          <h1
            className="fade-up text-5xl sm:text-6xl lg:text-7xl text-white leading-[0.95] tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, animationDelay: '0.1s' }}
          >
            Fire watches don&apos;t only<br />
            happen in care facilities.
          </h1>
          <p
            className="fade-up text-slate-300 text-xl leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ animationDelay: '0.2s' }}
          >
            Any building. Any industry. When a fire alarm or suppression system goes offline
            for 4 or more hours, NFPA 101 requires a fire watch — and that watch must be
            documented to survive an inspection.
          </p>
          <div
            className="fade-up flex flex-col sm:flex-row gap-3 justify-center"
            style={{ animationDelay: '0.3s' }}
          >
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-base shadow-xl shadow-blue-900/50 transition-all hover:-translate-y-0.5"
            >
              Start Free Trial →
            </Link>
            <Link
              href="/"
              className="px-8 py-4 text-white/70 hover:text-white font-semibold rounded-xl text-base border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 transition-all"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* ── The rule ── */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <RevealOnScroll>
            <blockquote className="text-slate-700 text-xl leading-relaxed font-medium italic border-l-4 border-orange-400 pl-6 text-left">
              &ldquo;When a required fire alarm system is out of service for more than 4 hours
              in a 24-hour period, the authority having jurisdiction shall be notified,
              and the building shall be evacuated or an approved fire watch shall be provided.&rdquo;
            </blockquote>
            <p className="text-slate-400 text-sm mt-3 text-left pl-6">
              NFPA 101, Life Safety Code §9.6.1.6 — applies to all occupancy types
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── Industry cards ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-14">
            <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">Every building type</div>
            <h2
              className="text-4xl lg:text-5xl text-slate-900 leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              One platform. Any fire watch.
            </h2>
            <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto">
              DutyProof was built for care facilities — but the compliance problem is the same everywhere.
            </p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {industries.map((ind, i) => (
              <RevealOnScroll key={ind.name} delay={i * 40}>
                <div className="bg-white rounded-2xl border border-slate-200 p-7 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all">
                  <div className="text-3xl mb-4">{ind.icon}</div>
                  <h3
                    className="text-lg text-slate-900 mb-3"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                  >
                    {ind.name}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-3">{ind.trigger}</p>
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-slate-400 text-xs leading-relaxed">{ind.stakes}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's the same ── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-12">
            <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">The compliance problem</div>
            <h2
              className="text-4xl lg:text-5xl text-slate-900 leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              The stakes change.<br />The documentation doesn&apos;t.
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={100} className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { n: '< 60 sec', l: 'Missed check-in escalation to supervisor or manager' },
              { n: 'Write-once', l: 'Immutable audit log — no edits, no deletions, ever' },
              { n: '1-click', l: 'Timestamped PDF report ready for any inspector' },
            ].map((s) => (
              <div key={s.n} className="bg-slate-50 rounded-2xl p-7 border border-slate-100">
                <div
                  className="text-3xl text-slate-900 mb-2"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                >
                  {s.n}
                </div>
                <div className="text-slate-500 text-sm">{s.l}</div>
              </div>
            ))}
          </RevealOnScroll>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-slate-950 py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20" style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }} />
        <RevealOnScroll className="relative max-w-2xl mx-auto px-6 text-center">
          <h2
            className="text-5xl text-white mb-6 leading-[0.95]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            When the inspector<br />walks in, you&apos;ll be ready.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Set up your first fire watch in under two minutes.
            SMS check-ins. Automatic escalation. One-click PDF report.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-9 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg shadow-2xl shadow-blue-900/60 transition-all hover:-translate-y-0.5"
          >
            Start 14-Day Free Trial →
          </Link>
          <p className="mt-4 text-slate-500 text-xs">
            14-day free trial · $149/facility/month after · Cancel any time
          </p>
        </RevealOnScroll>
      </section>
    </>
  )
}
