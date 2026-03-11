import Link from 'next/link'
import PageHero from '@/components/PageHero'

export const metadata = {
  title: 'Security & Data Protection',
  description:
    'How DutyProof protects fire watch records — tamper-evident logs, access controls, data retention, and infrastructure details for OSHA and fire marshal audits.',
}

const protections = [
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    heading: 'Records are write-once',
    body: 'Every check-in, missed check-in, and escalation event is written once and permanently locked. There is no edit function. There is no delete function. No one — including DutyProof staff — can alter a record after it is created.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    heading: 'Timestamps come from the server, not the device',
    body: 'Check-in times are set by our servers at the moment the event is recorded — not by the worker\'s phone. This prevents backdating. The time on the record is the time it actually happened.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>,
    heading: 'Delivery receipts are logged',
    body: 'When optional SMS delivery is used, every outbound message includes a carrier delivery receipt stored alongside the check-in record. If an inspector asks whether a message was actually sent and delivered, the receipt is there.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    heading: 'Job site data is fully isolated',
    body: 'Each job site\'s watch data, personnel, and reports are completely separated at the database level. Administrators at one job site cannot see or access data from another job site, even within the same organization.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    heading: 'Role-based access control',
    body: 'Admin accounts control job site setup, worker assignment, and report access. Supervisor accounts can monitor active watches and receive escalations. Fire watch workers interact only via their check-in link — they never log into the platform.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    heading: 'Encrypted in transit and at rest',
    body: 'All data is transmitted over HTTPS/TLS. Data at rest is encrypted using AES-256. Backups are encrypted. No unencrypted copies of watch data exist anywhere in the system.',
  },
]

const retention = [
  { label: 'Watch logs & check-in records', value: 'Life of account + 12 months after cancellation' },
  { label: 'PDF compliance reports', value: 'Generated on demand, available for life of account + 12 months' },
  { label: 'SMS delivery receipts (when SMS enabled)', value: 'Retained with each check-in record' },
  { label: 'Missed check-in & escalation events', value: 'Life of account + 12 months after cancellation' },
  { label: 'Account & billing data', value: 'Retained per Stripe and legal requirements' },
]

const infra = [
  { label: 'Database & auth', value: 'Supabase (PostgreSQL on AWS)' },
  { label: 'Application hosting', value: 'Vercel (edge network, global CDN)' },
  { label: 'SMS delivery (optional)', value: 'Twilio' },
  { label: 'Payment processing', value: 'Stripe' },
  { label: 'Uptime monitoring', value: 'Continuous' },
]

export default function SecurityPage() {
  return (
    <div className="bg-white">

      <PageHero
        tag="Security & Trust"
        tagStyle="pill"
        title="Built to hold up under scrutiny"
        subtitle="When an OSHA inspector or fire marshal asks for documentation, DutyProof records need to be unimpeachable. Here is exactly how they are protected."
      />

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
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">{p.icon}</div>
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
                'Assigned worker name and phone number (if SMS enabled)',
                'Check-in interval (15 or 30 minutes)',
                'Every check-in timestamp and GPS coordinates',
                'SMS delivery receipt for each check-in (when SMS enabled)',
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
            We do not store social security numbers, government-issued ID numbers, or any sensitive personal information beyond what is needed to deliver check-in links.
            Worker phone numbers, when provided for optional SMS delivery, are used only for check-in link delivery.
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
              Records are retained for the life of your account plus 12 months after cancellation — long enough for any open inspection cycle.
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
              Get started
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
