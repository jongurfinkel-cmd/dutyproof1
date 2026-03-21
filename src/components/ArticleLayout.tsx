import Link from 'next/link'

export default function ArticleLayout({
  tag,
  tagColor,
  title,
  readTime,
  children,
}: {
  tag: string
  tagColor: string
  title: string
  readTime: string
  children: React.ReactNode
}) {
  return (
    <>
      {/* Hero */}
      <section className="bg-slate-950 pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm font-medium mb-6 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Resources
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${tagColor}`}>
              {tag}
            </span>
            <span className="text-slate-500 text-xs">{readTime}</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}
          >
            {title}
          </h1>
        </div>
      </section>

      {/* Body */}
      <article className="py-12 sm:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline text-slate-600 text-[15px] leading-relaxed">
          {children}
        </div>
      </article>

      {/* CTA */}
      <section className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2
            className="text-xl sm:text-2xl text-slate-900 mb-3"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Don&apos;t let documentation be your weak link.
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            DutyProof automates fire watch verification with GPS-stamped, tamper-proof records.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
          >
            Start Your First Watch →
          </Link>
        </div>
      </section>
    </>
  )
}
