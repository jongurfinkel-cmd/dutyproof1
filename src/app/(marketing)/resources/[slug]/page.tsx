import { notFound } from 'next/navigation'
import Link from 'next/link'
import { articles, getArticle, getAdjacentArticles } from '@/lib/articles'

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return { title: 'Article Not Found' }
  return {
    title: `${article.title} — DutyProof Resources`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://dutyproof.com/resources/${article.slug}`,
      siteName: 'DutyProof',
      type: 'article',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const { prev, next } = getAdjacentArticles(slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    url: `https://dutyproof.com/resources/${article.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'DutyProof',
      url: 'https://dutyproof.com',
      logo: 'https://dutyproof.com/icon.svg',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://dutyproof.com/resources/${article.slug}`,
    },
    ...(article.sourceUrl ? { citation: { '@type': 'CreativeWork', name: article.source, url: article.sourceUrl } } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${article.tagColor}`}>
              {article.tag}
            </span>
            <span className="text-slate-500 text-xs">{article.readTime}</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}
          >
            {article.title}
          </h1>
        </div>
      </section>

      {/* Body */}
      <article className="py-12 sm:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          {/* Intro */}
          <p className="text-slate-600 text-[15px] leading-relaxed mb-10">
            {article.intro}
          </p>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {article.stats.map((s, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div
                  className="text-2xl sm:text-3xl text-slate-900 mb-1"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                >
                  {s.value}
                </div>
                <div className="text-xs text-slate-500 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Sections */}
          <div className="prose prose-slate prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline text-slate-600 text-[15px] leading-relaxed">
            {article.sections.map((s, i) => (
              <div key={i} className="mb-8">
                <h2 className="text-lg sm:text-xl text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  {s.heading}
                </h2>
                <p>{s.content}</p>
              </div>
            ))}
          </div>

          {/* Source */}
          {article.source && (
            <div className="mt-10 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Source:{' '}
                {article.sourceUrl ? (
                  <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {article.source}
                  </a>
                ) : (
                  <span>{article.source}</span>
                )}
              </p>
            </div>
          )}
        </div>
      </article>

      {/* Next / Prev navigation */}
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className={`grid gap-4 ${prev && next ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {prev && (
              <Link
                href={`/resources/${prev.slug}`}
                className="group flex flex-col gap-1.5 p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all"
              >
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  Previous
                </span>
                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors leading-snug">
                  {prev.title}
                </span>
              </Link>
            )}
            {next && (
              <Link
                href={`/resources/${next.slug}`}
                className={`group flex flex-col gap-1.5 p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all ${prev ? 'text-right' : ''}`}
              >
                <span className={`text-xs text-slate-400 flex items-center gap-1 ${prev ? 'justify-end' : ''}`}>
                  Next
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </span>
                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors leading-snug">
                  {next.title}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="py-12 bg-white border-t border-slate-100">
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
