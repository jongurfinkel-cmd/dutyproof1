import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Start Free Trial — Fire Watch Compliance Software',
  description:
    'Create your DutyProof account and start a 60-day free trial. Automated fire watch SMS check-ins, tamper-proof audit logs, and OSHA-ready PDF reports for hot work contractors.',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
