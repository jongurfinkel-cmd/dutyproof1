import Link from 'next/link'

export const metadata = {
  title: 'Security & Data Protection',
  description:
    'How DutyProof protects fire watch records — tamper-evident logs, access controls, data retention, and infrastructure details for OSHA and fire marshal audits.',
}

const protections = [
  {
    icon: '🔒',
    heading: 'Records are write-once',
    body: 'Every check-in, missed check-in, and escalation event is written once and permanently locked. There is no edit function. There is no delete function. No one — including DutyProof staff — can alter a record after it is created.',
  },
  {
    icon: '🕐',
    heading: 'Timestamps come from the server, not the device',
    body: 'Check-in times are set by our servers at the moment the event is recorded — not by the worker\'s phone. This prevents backdating. The time on the record is the time it actually happened.',
  },
  {
    icon: '📋',
    heading: 'SMS delivery receipts are logged',
    body: 'Every outbound check-in SMS includes a carrier delivery receipt that is stored alongside the check-in record. If an inspector asks whether a message was actually sent and delivered, the receipt is there.',
  },
  {
    icon: '👥',
    heading: 'Job site data is fully isolated',
    body: 'Each job site\'s watch data, personnel, and reports are completely separated at the database level. Administrators at one job site cannot see or access data from another job site, even within the same organization.',
  },
  {
    icon: '🛡️',
    heading: 'Role-based access control',
    body: 'Admin accounts control job site setup, worker assignment, and report access. Supervisor accounts can monitor active watches and receive escalations. Fire watch workers interact only via SMS — they never log into the platform.',
  },
  {
    icon: '🌐',
    heading: 'Encrypted in transit and at rest',
    body: 'All data is transmitted over HTTPS/TLS. Data at rest is encrypted using AES-256. Backups are encrypted. No unencrypted copies of watch data exist anywhere in the system.',
  },
]

const retention = [
  { label: 'Watch logs & check-in records', value: 'Retained indefinitely' },
  { label: 'PDF compliance reports', value: 'Generated on demand, always available' },
  { label: 'SMS delivery receipts', value: 'Retained with each check-in record' },
  { label: 'Missed check-in & escalation events', value: 'Retained indefinitely' },
  { label: 'Account & billing data', value: 'Retained per Stripe and legal requirements' },
]

const infra = [
  { label: 'Database & auth', value: 'Supabase (PostgreSQL on AWS)' },
  { label: 'Application hosting', value: 'Vercel (edge network, global CDN)' },
  { label: 'SMS delivery', value: 'Twilio' },
  { label: 'Payment processing', value: 'Stripe' },
  { label: 'Uptime monitoring', value: 'Continuous' },
]

export default function SecurityPage() {
  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="bg-slate-950 py-16 sm:py-20 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block bg-blue-600/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
            Security & Trust
          </div>
          <h1
            className="text-2xl sm:text-4xl lg:text-5xl text-white mb-4"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Built to hold up under scrutiny
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            When an OSHA inspector or fire marshal asks for documentation, DutyProof records need to be unimpeachable.
            Here is exactly how they are protected.
          </p>
        </div>
      </section>

      {/* ── Record Protection ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-xl sm:text-3xl text-slate-900 mb-3"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              How records are protected
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
              The audit log is the product. Every architectural decision reinforces its integrity.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {protections.map((p) => (
              <div key={p.heading} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <div className="text-2xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm sm:text-base">{p.heading}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What We Store ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-xl sm:text-3xl text-slate-900 mb-3"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              What we store
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              We collect only what is necessary to operate the service and support compliance documentation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Per fire watch</h3>
            </div>
            <ul className="divide-y divide-slate-100 text-sm text-slate-600">
              {[
                'Job site name and timezone',
                'Watch start and end timestamps (server-side)',
                'Assigned worker name and phone number',
                'Check-in interval (15 or 30 minutes)',
                'Every check-in timestamp and GPS coordinates',
                'SMS delivery receipt for each check-in',
                'Missed check-in events and escalation timestamps',
                'Watch end reason and supervisor name',
              ].map((item) => (
                <li key={item} className="px-6 py-3 flex items-center gap-3">
                  <span className="text-blue-500 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-slate-400 text-xs text-center mt-4">
            We do not store social security numbers, government-issued ID numbers, or any sensitive personal information beyond what is needed to send check-in SMS messages.
            Worker phone numbers are used only for SMS check-in delivery.
          </p>
        </div>
      </section>

      {/* ── Retention ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-xl sm:text-3xl text-slate-900 mb-3"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Record retention
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              OSHA and fire marshal audits can reference events from prior inspections. Records do not expire.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Record type</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {retention.map((r) => (
                  <tr key={r.label}>
                    <td className="px-5 py-3.5 text-slate-600">{r.label}</td>
                    <td className="px-5 py-3.5 text-slate-900 font-medium">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Infrastructure ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-xl sm:text-3xl text-slate-900 mb-3"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Infrastructure
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              DutyProof is built on infrastructure providers with their own independent security certifications.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Component</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {infra.map((r) => (
                  <tr key={r.label}>
                    <td className="px-5 py-3.5 text-slate-600">{r.label}</td>
                    <td className="px-5 py-3.5 text-slate-900 font-medium">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Questions CTA ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-950 border-t border-slate-800">
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="text-xl sm:text-2xl text-white mb-3"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Questions before you commit?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-6">
            If your compliance team, IT department, or legal counsel has specific questions about data handling,
            retention, or architecture — we will answer them directly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/support"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm"
            >
              Contact us →
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all text-sm"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
