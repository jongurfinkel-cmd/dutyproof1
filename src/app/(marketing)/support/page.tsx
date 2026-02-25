import Link from 'next/link'

export const metadata = {
  title: 'Support',
  description:
    'Get help with DutyProof fire watch compliance software. Common questions about SMS check-ins, missed check-in alerts, PDF reports, and account setup. We respond within a few hours.',
}

const TOPICS = [
  {
    q: 'A worker isn\'t receiving their check-in SMS.',
    a: 'First confirm the phone number is correct on the watch detail page. SMS delivery can be delayed by carrier filtering on some numbers — particularly VOIP lines or numbers with spam-block services enabled. If the number is correct and delivery is failing, email us and we\'ll investigate the carrier logs.',
  },
  {
    q: 'How do I add or remove a job site?',
    a: 'Go to Job Sites in the sidebar. You can add new job sites and manage existing ones there. Each active job site counts toward your monthly billing. Removing a job site (deactivating all its watches) stops future billing for that job site at the next cycle.',
  },
  {
    q: 'Can I download a PDF report for a watch that\'s still active?',
    a: 'Reports are generated when a watch ends. While a watch is active, you can view the full check-in timeline on the watch detail page. End the watch to generate the downloadable PDF compliance report.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your compliance records and PDF reports remain downloadable for 12 months after cancellation. After that period, data is deleted from our servers. We strongly recommend downloading reports for any watches that may be subject to future inspection before cancelling.',
  },
  {
    q: 'I need to set up multiple simultaneous watches at the same job site.',
    a: 'Supported. Start a new watch for each location or worker — you can run as many concurrent watches as needed within the same job site. Each watch has its own check-in interval, worker, and audit trail. All appear on your dashboard sorted by urgency.',
  },
]

export default function SupportPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-950 py-20">
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
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="text-blue-500 text-xs font-bold tracking-widest uppercase mb-4">Support</div>
          <h1
            className="text-5xl text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            We&apos;re here when<br />you need us.
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            DutyProof is founder-supported. When you reach out, you&apos;re talking to the team that built it — not a ticketing queue.
          </p>
        </div>
      </section>

      {/* ── Contact cards ── */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
            {/* Email */}
            <div className="rounded-2xl border-2 border-slate-200 p-7">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="font-bold text-slate-900 text-base mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Email support
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                For anything — setup questions, billing, technical issues, or compliance questions.
              </p>
              <a
                href="mailto:support@dutyproof.com"
                className="text-blue-600 hover:text-blue-500 font-semibold text-sm transition-colors"
              >
                support@dutyproof.com →
              </a>
            </div>

            {/* Response time */}
            <div className="rounded-2xl border-2 border-slate-200 p-7">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <h2 className="font-bold text-slate-900 text-base mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Response time
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                We respond within a few hours during business hours, Monday through Friday.
              </p>
              <div className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Typically same business day
              </div>
            </div>
          </div>

          {/* Common questions */}
          <div>
            <h2
              className="text-2xl text-slate-900 mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Common questions
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              Quick answers to the most frequent support topics. Don&apos;t see yours?{' '}
              <a href="mailto:support@dutyproof.com" className="text-blue-600 hover:text-blue-500 font-semibold transition-colors">
                Email us.
              </a>
            </p>

            <div className="divide-y divide-slate-200">
              {TOPICS.map((item, i) => (
                <div key={i} className="py-5">
                  <p className="font-semibold text-slate-800 text-sm mb-2">{item.q}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* See also */}
          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Looking for product FAQs?</p>
              <p className="text-slate-500 text-xs mt-0.5">Pricing, compliance, intervals, and more are covered on the main page.</p>
            </div>
            <Link
              href="/#pricing"
              className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-xl transition-colors"
            >
              View FAQ & Pricing →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
