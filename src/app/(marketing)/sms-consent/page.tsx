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
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>How SMS Opt-In Works</h2>
              <p className="mb-3">
                SMS is an optional feature in DutyProof. Users can create and manage fire watches without enabling SMS. When creating a watch, SMS is controlled by a toggle that is <strong>off by default</strong>. Below is exactly what users see in the application:
              </p>

              {/* ── Step 1: SMS OFF (default) ── */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex-shrink-0">1</span>
                  <p className="font-semibold text-slate-900">Default State — SMS Off</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">When creating a fire watch, the SMS toggle is off by default. No phone number field or SMS consent is shown. The user can start a watch without SMS.</p>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">SMS Check-in Reminders</p>
                      <p className="text-xs text-slate-500">Send check-in links and alerts to the worker via text message (optional)</p>
                    </div>
                    <div className="relative w-11 h-6 rounded-full bg-slate-200 flex-shrink-0 ml-4">
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
                  <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg">Start Watch</span>
                  <p className="text-xs text-slate-500 mt-2">Button does not mention SMS — watch starts without any text messages.</p>
                </div>
              </div>

              {/* ── Step 2: SMS ON ── */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0">2</span>
                  <p className="font-semibold text-slate-900">User Enables SMS (Optional)</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">If the user chooses to enable SMS, the toggle turns on and a phone number field appears. A separate, unchecked consent checkbox is required before SMS can be sent.</p>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">SMS Check-in Reminders</p>
                      <p className="text-xs text-slate-500">Send check-in links and alerts to the worker via text message (optional)</p>
                    </div>
                    <div className="relative w-11 h-6 rounded-full bg-blue-600 flex-shrink-0 ml-4">
                      <span className="absolute top-0.5 left-5 w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                  </div>
                  <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Worker&apos;s Phone *</p>
                    <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-400 bg-white">+1 (212) 000-0000</div>
                  </div>
                </div>
              </div>

              {/* ── Step 3: Consent checkbox ── */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0">3</span>
                  <p className="font-semibold text-slate-900">SMS Consent Checkbox (Unchecked by Default)</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">This consent checkbox only appears when SMS is enabled. It is unchecked by default and must be actively selected by the user before any SMS messages can be sent. The button changes to &ldquo;Start Watch &amp; Send SMS&rdquo; only when SMS is enabled.</p>
                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-default">
                    <input type="checkbox" disabled className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600" />
                    <span className="text-sm text-slate-800 leading-relaxed">
                      I agree to receive automated SMS text messages from DutyProof related to fire watch patrol reminders, missed check-in alerts, supervisor escalation alerts, and safety checklist links. Message frequency varies based on watch activity and check-in schedules. Msg &amp; data rates may apply. Reply STOP to opt out. Reply HELP for help. SMS consent is not required to use DutyProof.
                    </span>
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500 transition-colors">Terms of Service</Link>
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500 transition-colors">Privacy Policy</Link>
                </div>
                <div className="mt-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
                  <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg">Start Watch &amp; Send SMS</span>
                  <p className="text-xs text-slate-500 mt-2">Button label changes to include &ldquo;Send SMS&rdquo; only when SMS is enabled and consent is given.</p>
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
