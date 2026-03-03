import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up — Fire Watch Compliance Software',
  description:
    'Create your DutyProof account. Automated fire watch SMS check-ins, tamper-proof audit logs, and OSHA-ready PDF reports for hot work contractors. $199/mo flat rate.',
  robots: { index: true, follow: true },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
