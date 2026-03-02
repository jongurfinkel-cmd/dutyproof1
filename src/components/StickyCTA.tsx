'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function StickyCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const sentinel = document.getElementById('sticky-sentinel')
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="hidden sm:block text-sm text-slate-500 font-medium">
          <span className="text-slate-900 font-bold">$199/mo</span> · Unlimited sites · 30-day money-back guarantee
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/signup"
            className="flex-1 sm:flex-none text-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-200/70 hover:-translate-y-px"
          >
            Get Started — $199/mo →
          </Link>
          <a
            href="mailto:jon@dutyproof.com?subject=Book%20a%20DutyProof%20Demo"
            className="hidden sm:block px-4 py-2.5 text-slate-500 hover:text-slate-900 font-semibold text-sm rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
          >
            Book a Demo
          </a>
        </div>
      </div>
    </div>
  )
}
