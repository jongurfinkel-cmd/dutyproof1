import Link from 'next/link'
import PageHero from '@/components/PageHero'

export const metadata = {
  title: 'SMS Terms & Consent',
  description: 'DutyProof SMS messaging terms, consent policy, and opt-out instructions.',
}

const LAST_UPDATED = 'March 2026'

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
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>How Worker SMS Opt-In Works (Double Opt-In)</h2>
              <p className="mb-3">
                DutyProof uses a <strong>double opt-in</strong> process to ensure the actual message recipient (the fire watcher) directly consents to receiving SMS messages. SMS is an optional feature — users can create and manage fire watches without enabling any SMS. No phone numbers are required at any point. Below is the complete worker opt-in flow:
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
                  <p className="font-semibold text-slate-900">Supervisor Enables SMS &amp; Enters Worker&apos;s Phone</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">If the supervisor chooses to enable SMS, the toggle turns on and the worker&apos;s phone number field appears. A separate authorization checkbox is required.</p>
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

              {/* ── Step 3: Authorization checkbox ── */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0">3</span>
                  <p className="font-semibold text-slate-900">Supervisor Authorization (First Opt-In)</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">The supervisor checks an authorization checkbox to allow DutyProof to send a <strong>single consent request SMS</strong> to the worker. This does <strong>not</strong> consent on behalf of the worker — it only authorizes the initial outreach.</p>
                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-default">
                    <input type="checkbox" disabled className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600" />
                    <span className="text-sm text-slate-800 leading-relaxed">
                      I authorize DutyProof to send a one-time SMS consent request to the watcher at the number provided. The watcher must confirm directly before any operational messages are sent. Msg &amp; data rates may apply. Reply STOP to opt out. Reply HELP for help. See <span className="text-blue-600">SMS Terms</span> and <span className="text-blue-600">Privacy Policy</span>.
                    </span>
                  </label>
                </div>
                <div className="mt-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
                  <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg">Start Watch &amp; Send SMS</span>
                  <p className="text-xs text-slate-500 mt-2">Clicking this sends exactly <strong>one</strong> consent request SMS to the worker. No operational messages are sent yet.</p>
                </div>
              </div>

              {/* ── Step 4: Consent SMS to worker ── */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex-shrink-0">4</span>
                  <p className="font-semibold text-slate-900">Worker Receives Consent Request SMS</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">The worker receives a single text message asking them to confirm consent. This is the only message sent before the worker explicitly opts in. The message contains a unique, one-time confirmation link.</p>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sample consent SMS</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
                    DutyProof: John, your supervisor has assigned you to fire watch at Main Campus — Building A. To receive check-in reminders via text, confirm here: https://dutyproof.com/sms-confirm/abc123
                    <br /><br />
                    Msg frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help. Consent is not required to use DutyProof.
                  </div>
                </div>
              </div>

              {/* ── Step 5: Worker confirms ── */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0">5</span>
                  <p className="font-semibold text-slate-900">Worker Confirms Consent (Second Opt-In)</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">The worker taps the link in the SMS and lands on a consent confirmation page. The page clearly describes the types of messages, frequency, costs, and opt-out instructions. The worker must tap &ldquo;I Agree&rdquo; to confirm. <strong>Only after this confirmation</strong> does DutyProof begin sending operational check-in reminders.</p>
                <div className="bg-white border border-green-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-800">Consent confirmation page shows:</p>
                  <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
                    <li>Types of messages (check-in reminders, missed check-in alerts, watch summary)</li>
                    <li>Sender identity (DutyProof / Gurfinkel Ventures LLC)</li>
                    <li>Message frequency (varies by watch schedule)</li>
                    <li>Cost disclosure (Msg &amp; data rates may apply)</li>
                    <li>Opt-out instructions (Reply STOP at any time)</li>
                    <li>Help instructions (Reply HELP or email support@dutyproof.com)</li>
                    <li>Links to Privacy Policy and Terms of Service</li>
                  </ul>
                  <div className="pt-2">
                    <span className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg">I Agree — Send Me Check-In Reminders</span>
                  </div>
                  <p className="text-xs text-slate-500">After tapping &ldquo;I Agree,&rdquo; operational SMS messages begin. If the worker does not confirm, no further messages are sent — the watch continues without SMS.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Supervisor Escalation SMS (Optional)</h2>
              <p className="mb-3">
                Separately from worker check-in reminders, DutyProof can send missed check-in alerts to a designated supervisor via SMS. <strong>Supervisor SMS escalation is entirely optional</strong> — it is off by default and not required to create or manage fire watches. When supervisor SMS is not enabled, missed check-in notifications are sent to the account holder&apos;s email instead.
              </p>

              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex-shrink-0">1</span>
                  <p className="font-semibold text-slate-900">Default State — Supervisor SMS Off</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">When creating a fire watch, the &ldquo;SMS Supervisor Escalation&rdquo; toggle is off by default. No supervisor phone number field is shown. Missed check-in alerts go to the account email.</p>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">SMS Supervisor Escalation</p>
                      <p className="text-xs text-slate-500">Send missed check-in alerts to a supervisor via text message (optional)</p>
                    </div>
                    <div className="relative w-11 h-6 rounded-full bg-slate-200 flex-shrink-0 ml-4">
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex-shrink-0">2</span>
                  <p className="font-semibold text-slate-900">Supervisor Enables SMS Escalation &amp; Enters Their Phone</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">The supervisor (account holder) chooses to enable SMS escalation and enters their own phone number. This is voluntary — they are providing their own number for their own use.</p>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">SMS Supervisor Escalation</p>
                      <p className="text-xs text-slate-500">Send missed check-in alerts to a supervisor via text message (optional)</p>
                    </div>
                    <div className="relative w-11 h-6 rounded-full bg-blue-600 flex-shrink-0 ml-4">
                      <span className="absolute top-0.5 left-5 w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                  </div>
                  <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Supervisor Phone *</p>
                    <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-400 bg-white">+1 (555) 000-0000</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0">3</span>
                  <p className="font-semibold text-slate-900">Supervisor Provides Direct Consent</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">Before SMS escalation can be activated, the supervisor must check a consent checkbox directly in the app. This constitutes explicit, affirmative consent from the actual phone number owner.</p>
                <div className="bg-white border border-amber-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-default">
                    <input type="checkbox" disabled className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-amber-600" />
                    <span className="text-sm text-slate-800 leading-relaxed">
                      I consent to receive missed check-in alert SMS messages at the supervisor phone number provided above. Msg &amp; data rates may apply. Reply STOP to opt out at any time. Reply HELP for assistance. SMS escalation is not required to use DutyProof. See <span className="text-blue-600">Terms</span> and <span className="text-blue-600">Privacy Policy</span>.
                    </span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-3">If the supervisor does not check this box, SMS escalation is not enabled and missed check-in alerts are sent via email only. The watch proceeds normally without any SMS to the supervisor.</p>
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
