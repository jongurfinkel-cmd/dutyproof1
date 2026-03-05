import Link from 'next/link'
import PageHero from '@/components/PageHero'

export const metadata = {
  title: 'Privacy Policy',
  description: 'DutyProof Privacy Policy — how we collect, use, and protect your data.',
}

const LAST_UPDATED = 'February 2026'

export default function PrivacyPage() {
  return (
    <>
      <PageHero tag="Legal" title="Privacy Policy" meta={`Last updated: ${LAST_UPDATED}`} />

      {/* ── Content ── */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-10 text-slate-600 text-sm leading-relaxed">

            <div>
              <p>
                This Privacy Policy explains how DutyProof (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and protects information when you use our fire watch compliance platform (&quot;Service&quot;). Please read this policy before using the Service.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>1. Information We Collect</h2>

              <h3 className="text-slate-800 font-semibold text-sm mb-2 mt-4">Account Information</h3>
              <p className="mb-4">
                When you create an account, we collect your email address and password (stored as a secure hash). We use this to authenticate you and communicate with you about your account.
              </p>

              <h3 className="text-slate-800 font-semibold text-sm mb-2">Job Site and Watch Data</h3>
              <p className="mb-4">
                You provide job site names, locations, and other descriptive information when setting up fire watches. This information is stored and associated with your account to generate compliance records.
              </p>

              <h3 className="text-slate-800 font-semibold text-sm mb-2">Worker Information</h3>
              <p className="mb-4">
                To send SMS check-in links, you provide the name and mobile phone number of the fire watch worker assigned to each watch. This information is stored with the watch record and included in compliance reports.
              </p>

              <h3 className="text-slate-800 font-semibold text-sm mb-2">Check-In Data</h3>
              <p className="mb-4">
                When a worker completes a check-in by tapping the SMS link, we capture:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mb-4">
                <li>A server-side timestamp at the moment the check-in is recorded</li>
                <li>The worker&apos;s GPS coordinates, if location permission is granted by the worker&apos;s device</li>
                <li>SMS delivery status from our SMS provider</li>
              </ul>
              <p>
                GPS coordinates are used solely to verify the worker&apos;s location at the time of check-in and are included in compliance reports. Location is captured only at the moment of check-in — we do not track worker location continuously.
              </p>

              <h3 className="text-slate-800 font-semibold text-sm mb-2 mt-4">Supervisor / Escalation Contacts</h3>
              <p className="mb-4">
                If you configure escalation alerts, you provide a supervisor&apos;s phone number. This number is used only to send missed check-in alert SMS messages and is not used for any other purpose.
              </p>

              <h3 className="text-slate-800 font-semibold text-sm mb-2">Payment Information</h3>
              <p>
                Payment is processed by Stripe. We do not store your full credit card number, CVV, or payment card data on our servers. We store only the billing details Stripe provides for subscription management (last 4 digits, expiry, billing email).
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To operate the Service: authenticate users, send check-in SMS messages, record check-in events, and generate compliance reports</li>
                <li>To send missed check-in escalation alerts to designated supervisors</li>
                <li>To generate and store PDF compliance reports on your behalf</li>
                <li>To process billing and manage your subscription</li>
                <li>To communicate with you about your account, billing, and material service changes</li>
                <li>To investigate and resolve technical issues</li>
              </ul>
              <p className="mt-4">
                We do not sell your data. We do not use your data for advertising. We do not share personally identifiable information with third parties except as described in this policy.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>3. SMS Messaging</h2>
              <p className="mb-3">
                Worker phone numbers are used exclusively to deliver fire watch check-in links and confirmation messages via SMS. Supervisor phone numbers are used exclusively to deliver missed check-in alert messages. These are transactional messages directly related to the service you have configured.
              </p>
              <p>
                Message and data rates may apply to recipients based on their carrier plan. Workers and supervisors receive SMS messages because a DutyProof account administrator has provided their number and started an active watch. If a worker or supervisor believes they are receiving messages in error, they should contact the account administrator or <Link href="/support" className="text-blue-600 hover:text-blue-500 transition-colors">contact us</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>4. Third-Party Service Providers</h2>
              <p className="mb-4">We use the following third-party services to operate DutyProof:</p>

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-800 mb-1">Supabase</p>
                  <p>Our database and authentication provider. All application data — accounts, job sites, watches, check-in records — is stored in Supabase-hosted infrastructure.</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-800 mb-1">Twilio</p>
                  <p>Our SMS delivery provider. Worker and supervisor phone numbers are transmitted to Twilio for the purpose of sending check-in and escalation messages.</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-800 mb-1">Stripe</p>
                  <p>Our payment processor. Stripe handles all payment card data. DutyProof does not store full card numbers or CVVs.</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-800 mb-1">Resend</p>
                  <p>Our email delivery provider. Used to deliver contact and walkthrough form submissions. No personal data beyond submitted form content is shared.</p>
                </div>
              </div>

              <p className="mt-4">
                We do not share your data with any other third parties except as required by law.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>5. Data Security</h2>
              <p className="mb-3">
                We apply row-level security (RLS) policies at the database level to ensure each account can only access its own data. Check-in records are write-once — once created, they cannot be edited or deleted, ensuring the integrity of compliance records.
              </p>
              <p>
                All data is transmitted over HTTPS. Passwords are hashed using industry-standard algorithms and are never stored in plaintext. Despite these measures, no system is 100% secure. We encourage you to use a strong, unique password for your account.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>6. Data Retention</h2>
              <p className="mb-3">
                We retain your data for the life of your account. If you cancel your subscription, your compliance records and PDF reports remain accessible for 12 months from the date of cancellation, after which your data is permanently deleted.
              </p>
              <p>
                If you request account deletion before the 12-month period, we will delete your data within 30 days of the request, except where retention is required by law.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>7. Worker and Third-Party Data</h2>
              <p>
                You are responsible for ensuring you have appropriate authorization to submit worker phone numbers and other personal information to the Service. By entering a worker&apos;s phone number, you represent that you have the right to send transactional SMS messages to that number in connection with a fire watch you have organized and that the worker is aware they will receive such messages.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>8. Your Rights</h2>
              <p className="mb-3">
                You may access, export, or request deletion of your data at any time by <Link href="/support" className="text-blue-600 hover:text-blue-500 transition-colors">contacting us</Link>. PDF compliance reports can be downloaded directly from the Service at any time while your account is active.
              </p>
              <p>
                If you are a resident of California, the European Union, or another jurisdiction with applicable privacy rights, you may have additional rights under laws such as the CCPA or GDPR. <Link href="/support" className="text-blue-600 hover:text-blue-500 transition-colors">Contact us</Link> to exercise these rights.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>9. Cookies</h2>
              <p>
                We use only essential session cookies required to keep you authenticated while logged in. We do not use advertising, tracking, or analytics cookies. We do not use third-party tracking pixels.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we do, we will update the &quot;Last updated&quot; date at the top of this page and notify active subscribers by email before material changes take effect.
              </p>
            </div>

            <div>
              <h2 className="text-slate-900 font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>11. Contact</h2>
              <p>
                DutyProof is a product of Gurfinkel Ventures LLC. Questions about this policy or requests related to your data?{' '}
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
