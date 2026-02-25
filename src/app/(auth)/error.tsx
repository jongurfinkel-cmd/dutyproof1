'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Auth error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">Something went wrong</h2>
        <p className="text-sm text-slate-400 mb-6">
          An unexpected error occurred. Please try again or return to the login page.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="px-5 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
