import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Get help with DutyProof fire watch compliance software. Common questions about SMS check-ins, missed check-in alerts, PDF reports, and account setup. We respond within a few hours.',
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
