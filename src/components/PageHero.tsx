interface PageHeroProps {
  tag: string
  title: string
  subtitle?: string
  /** Small muted text below the title (e.g. "Last updated: February 2026") */
  meta?: string
  /** Use a pill-style tag (like security page) vs plain text */
  tagStyle?: 'plain' | 'pill'
}

export default function PageHero({ tag, title, subtitle, meta, tagStyle = 'plain' }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 sm:py-20 px-4 sm:px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }}
      />
      <div className="relative max-w-3xl mx-auto">
        {tagStyle === 'pill' ? (
          <div className="inline-block bg-blue-600/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
            {tag}
          </div>
        ) : (
          <div className="text-blue-500 text-xs font-bold tracking-widest uppercase mb-4">{tag}</div>
        )}
        <h1
          className="text-2xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">{subtitle}</p>
        )}
        {meta && (
          <p className="text-slate-500 text-sm mt-1">{meta}</p>
        )}
      </div>
    </section>
  )
}
