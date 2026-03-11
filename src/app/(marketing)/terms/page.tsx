import Link from 'next/link'
import PageHero from '@/components/PageHero'

export const metadata = {
  title: 'Terms of Service',
  description: 'DutyProof Terms of Service.',
}

const LAST_UPDATED = 'March 2026'

export default function TermsPage() {
  return (
    <>
      <PageHero tag="Legal" title="Terms of Service" meta={`Last updated: ${LAST_UPDATED}`} />

      {/* ── Content ── */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-10 text-slate-600 text-sm leading-relaxed">

            <div>
              <p>
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of DutyProof (&quot;Service&quot;), operated by DutyProof (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>1. Description of Service</h2>
              <p>
                DutyProof is a fire watch compliance platform that generates secure, GPS-verified check-in links for active hot work watches. Check-in links are delivered via QR code, copied link, or optional SMS. The platform escalates missed check-ins to designated supervisors and generates compliance documentation for welding contractors, pipefitters, mechanical contractors, and other businesses subject to hot work fire watch requirements. The Service is a documentation and notification tool. It does not constitute legal advice, and compliance with local, state, or federal fire safety regulations remains the sole responsibility of the customer.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>2. Account Registration</h2>
              <p className="mb-3">
                You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials. You are responsible for all activity that occurs under your account.
              </p>
              <p>
                Accounts are for use by one organization. You may not share account access with unaffiliated third parties or resell access to the Service.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>3. Subscription and Billing</h2>
              <p className="mb-3">
                Subscriptions are billed at a flat rate of $199 per month. The plan includes unlimited job sites and unlimited watches. There are no per-user fees or setup costs.
              </p>
              <p className="mb-3">
                All fees are in U.S. dollars and are non-refundable except as required by law. Billing occurs on a recurring basis from the date your subscription begins. Prices may change with 30 days&apos; notice.
              </p>
              <p>
                Payment processing is handled by Stripe. We do not store your full payment card information on our servers.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>4. SMS Communications</h2>
              <p className="mb-3">
                DutyProof offers optional SMS notifications as part of the Service. When enabled, these messages include check-in links, missed check-in alerts, and supervisor escalation notifications. Messages are time-sensitive and operational — they are not marketing messages. SMS is not required to use the DutyProof platform.
              </p>
              <p className="mb-3">
                The customer is responsible for ensuring that each message recipient has provided valid, affirmative consent to receive SMS messages from DutyProof where required by law and carrier policy. Consent must be obtained directly from the phone number owner before any messages are sent.
              </p>
              <p className="mb-3">
                <strong>Message frequency:</strong> Varies based on watch check-in interval (typically every 15–60 minutes during an active watch). <strong>Msg &amp; data rates may apply.</strong>
              </p>
              <p className="mb-3">
                <strong>Opt-out:</strong> Any message recipient may reply STOP at any time to stop receiving messages. Reply HELP for assistance. After opting out, no further messages will be sent to that number unless renewed consent is provided.
              </p>
              <p>
                SMS messages are delivered via Twilio. Carriers are not liable for delayed or undelivered messages. For SMS-related questions,{' '}
                <Link href="/support" className="text-blue-600 hover:text-blue-500 transition-colors">contact us</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>5. Cancellation</h2>
              <p className="mb-3">
                You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period — you will retain access through the end of the period you have paid for and will not be charged for the next period.
              </p>
              <p>
                Following cancellation, your compliance records and PDF reports remain accessible for 12 months. After that period, your data will be permanently deleted. We recommend downloading all compliance reports before cancelling if those records may be required for future inspections.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>6. Your Data</h2>
              <p className="mb-3">
                You retain ownership of all data you and your workers submit to the Service, including job site information, worker records, check-in logs, and compliance reports. We do not claim ownership of your data.
              </p>
              <p>
                You grant us a limited license to store, process, and transmit your data as necessary to operate the Service and provide you with the features you use, including delivering check-in links and generating PDF reports.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>7. Acceptable Use</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation</li>
                <li>Attempt to gain unauthorized access to any part of the Service or its underlying systems</li>
                <li>Transmit false, misleading, or fraudulent data through the Service</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Use the Service to send unsolicited messages to phone numbers not associated with a legitimate fire watch</li>
                <li>Reverse engineer, decompile, or attempt to derive the source code of the Service</li>
              </ul>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>8. Service Availability</h2>
              <p>
                We strive to maintain high availability but do not guarantee uninterrupted service. The Service is provided &quot;as is&quot; and &quot;as available.&quot; Scheduled maintenance will be communicated when possible. We are not liable for any downtime or service interruptions, including any missed check-ins or failed escalations that result from service unavailability.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>9. Disclaimer of Warranties</h2>
              <p>
                To the fullest extent permitted by law, DutyProof disclaims all warranties, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will meet your specific compliance requirements or that any documentation generated will satisfy the requirements of any particular regulatory authority, OSHA inspector, or fire marshal.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>10. Limitation of Liability</h2>
              <p className="mb-3">
                To the fullest extent permitted by law, DutyProof&apos;s total liability to you for any claim arising out of or related to the Service shall not exceed the fees paid by you in the three months preceding the claim.
              </p>
              <p>
                In no event shall DutyProof be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, even if we have been advised of the possibility of such damages.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>11. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless DutyProof and its officers, employees, and agents from any claims, damages, or expenses (including reasonable attorneys&apos; fees) arising out of your use of the Service, your violation of these Terms, or your violation of any applicable law.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>12. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. When we do, we will update the &quot;Last updated&quot; date at the top of this page and notify active subscribers by email at least 14 days before material changes take effect. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>13. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the United States and the state in which DutyProof is incorporated, without regard to conflict of law principles. Any disputes shall be resolved in the courts of that jurisdiction.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>14. Contact</h2>
              <p>
                DutyProof is a product of Gurfinkel Ventures LLC. Questions about these Terms?{' '}
                <Link href="/support" className="text-blue-600 hover:text-blue-500 transition-colors">
                  Contact us
                </Link>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
