import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1
        className="text-4xl text-white mb-2"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
      >
        Page not found
      </h1>
      <p className="text-slate-500 text-sm mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all"
        >
          Go Home
        </Link>
        <Link
          href="/support"
          className="px-5 py-2.5 text-slate-400 hover:text-white text-sm font-medium rounded-xl border border-slate-700 hover:border-slate-600 transition-all"
        >
          Contact Support
        </Link>
      </div>
    </div>
  )
}
