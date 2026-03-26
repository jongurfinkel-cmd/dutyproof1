import Link from 'next/link'
import PageHero from '@/components/PageHero'
import { articles } from '@/lib/articles'

export const metadata = {
  title: 'Resources — Fire Watch Compliance Insights',
  description:
    'Real cases, OSHA requirements, and insurance lessons every contractor should know before their next hot work permit. From the team behind DutyProof.',
  keywords: [
    'hot work fire watch requirements',
    'OSHA hot work citation',
    'hot work insurance claim denied',
    'fire watch after welding',
    'NFPA 51B fire watch',
    'hot work fire prevention',
  ],
}

const tierLabels: Record<number, { title: string; description: string }> = {
  1: {
    title: 'Essential Reading',
    description: 'The data and standards every contractor needs to know.',
  },
  2: {
    title: 'Deep Dives',
    description: 'Regulatory details, state requirements, and insurer expectations.',
  },
  3: {
    title: 'Case Studies',
    description: 'Real incidents and the lessons they left behind.',
  },
}

export default function ResourcesPage() {
  const tiers = [1, 2, 3] as const

  return (
    <>
      <PageHero
        tag="Resources"
        title="Cases, citations, and lessons from the field."
        subtitle="Real incidents. Real costs. Know what's at stake before your next hot work permit."
      />

      {tiers.map((tier) => {
        const tierArticles = articles.filter((a) => a.tier === tier)
        if (tierArticles.length === 0) return null
        const label = tierLabels[tier]

        return (
          <section key={tier} className={`py-16 sm:py-20 ${tier === 2 ? 'bg-slate-50 border-y border-slate-100' : 'bg-white'}`}>
            <div className="max-w-4xl mx-auto px-6">
              <div className="mb-8">
                <h2
                  className="text-xl sm:text-2xl text-slate-900 mb-1"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                >
                  {label.title}
                </h2>
                <p className="text-slate-500 text-sm">{label.description}</p>
              </div>

              <div className="space-y-5">
                {tierArticles.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/resources/${a.slug}`}
                    className="block group rounded-2xl border-2 border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/30 p-6 sm:p-8 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${a.tagColor}`}>
                        {a.tag}
                      </span>
                      <span className="text-slate-400 text-xs">{a.readTime}</span>
                    </div>
                    <h3
                      className="text-lg sm:text-xl text-slate-900 group-hover:text-blue-700 font-bold mb-2 transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {a.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {a.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1.5 mt-4 text-blue-600 text-sm font-semibold group-hover:gap-2.5 transition-all">
                      Read article
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* CTA */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2
            className="text-2xl sm:text-3xl text-slate-900 mb-4"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Don&apos;t wait for the audit.
          </h2>
          <p className="text-slate-500 mb-8">
            DutyProof gives you GPS-verified, tamper-proof fire watch records — ready before anyone asks.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-base shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
          >
            Start Your First Watch →
          </Link>
          <p className="mt-3 text-slate-400 text-xs">Plans from $199/mo · First watch free · Cancel any time</p>
        </div>
      </section>
    </>
  )
}
