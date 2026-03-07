import Link from 'next/link'
import PageHero from '@/components/PageHero'

export const metadata = {
  title: 'SMS Terms & Consent',
  description: 'DutyProof SMS messaging terms, consent policy, and opt-out instructions.',
}

const LAST_UPDATED = 'February 2026'

export default function SmsConsentPage() {
  return (
    <>
      <PageHero tag="Legal" title="SMS Terms & Consent" meta={`Last updated: ${LAST_UPDATED}`} />

      {/* ── Content ── */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-10 text-slate-600 text-sm leading-relaxed">

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>About DutyProof SMS</h2>
              <p>
                DutyProof sends operational SMS alerts and check-in reminders to workers and supervisors during active fire watches. All messages are time-sensitive and operational in nature — DutyProof does not send marketing or promotional text messages. SMS messaging is optional and not required to use the DutyProof platform.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Types of Messages</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Check-in reminders:</strong> SMS messages containing a unique link for the fire watcher to confirm they are on-site and actively monitoring. Sent at regular intervals (typically every 15–60 minutes) during an active fire watch.</li>
                <li><strong>Missed check-in alerts:</strong> Notifications sent to the fire watcher when a check-in is overdue, prompting immediate action.</li>
                <li><strong>Supervisor escalation alerts:</strong> Notifications sent to a designated supervisor when a fire watcher misses a check-in, enabling rapid response.</li>
                <li><strong>Pre-watch safety checklist:</strong> A one-time SMS with a link to complete required safety verification items before a watch begins.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Consent</h2>
              <p className="mb-3">
                SMS consent is optional and is not required to use the DutyProof platform. DutyProof can support fire watch workflows without SMS, depending on how the account administrator configures the watch.
              </p>
              <p className="mb-3">
                Each phone number owner must provide explicit, affirmative consent to receive SMS text messages before any messages are sent. Consent is collected via a checkbox-based opt-in at the time phone numbers are entered. The checkbox is unchecked by default — the recipient must actively select it.
              </p>
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700">
                <p className="font-semibold text-slate-900 mb-3">Sample Consent Experience</p>
                <p className="text-xs text-slate-500 mb-4">This is a preview of the opt-in presented to each SMS recipient within the DutyProof application:</p>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-default">
                    <input type="checkbox" disabled className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600" />
                    <span className="text-sm text-slate-800 leading-relaxed">
                      I agree to receive SMS text messages from DutyProof related to fire watch patrol reminders, missed check-in alerts, supervisor escalation alerts, and safety checklist links. Message frequency varies based on watch activity and check-in schedules. Msg &amp; data rates may apply. Reply STOP to opt out. Reply HELP for help. SMS consent is not required to use DutyProof.
                    </span>
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500 transition-colors">Terms of Service</Link>
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500 transition-colors">Privacy Policy</Link>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Message Frequency</h2>
              <p>
                Message frequency varies based on the check-in interval configured for each watch — typically every 15 to 60 minutes during an active fire watch. Watches are temporary and end when the fire watch period is complete. No recurring messages are sent outside of active watches.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Opt-Out</h2>
              <p className="mb-3">
                Any message recipient can opt out at any time by replying <strong>STOP</strong> to any DutyProof SMS. Once opted out, no further messages will be sent to that phone number unless consent is provided again for a new watch.
              </p>
              <p>
                Reply <strong>HELP</strong> to any message for assistance, or{' '}
                <Link href="/support" className="text-blue-600 hover:text-blue-500 transition-colors">contact us</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Costs</h2>
              <p>
                DutyProof does not charge recipients for SMS messages. However, standard message and data rates from your wireless carrier may apply. Contact your carrier for details about your messaging plan.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Carrier Disclaimer</h2>
              <p>
                Carriers are not liable for delayed or undelivered messages. Message delivery is subject to effective transmission from your wireless carrier. T-Mobile is not liable for delayed or undelivered messages.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Privacy</h2>
              <p>
                Phone numbers and message logs are stored securely and used solely for fire watch compliance operations. We do not sell, share, or rent phone numbers to third parties for marketing purposes. For full details, see our{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-500 transition-colors">Privacy Policy</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Contact</h2>
              <p>
                DutyProof is a product of Gurfinkel Ventures LLC. Questions about DutyProof SMS?{' '}
                <Link href="/support" className="text-blue-600 hover:text-blue-500 transition-colors">Contact us</Link>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
