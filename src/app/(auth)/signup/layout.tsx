import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up — Fire Watch Compliance Software',
  description:
    'Create your DutyProof account. Automated fire watch check-in verification, tamper-proof audit logs, and OSHA-ready PDF reports for hot work contractors. Plans from $199/mo.',
  robots: { index: true, follow: true },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
