'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import PageHero from '@/components/PageHero'

export default function WalkthroughPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/contact/walkthrough', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, phone, message }),
      })

      if (res.status === 429) {
        toast.error('Too many requests. Please try again in a few minutes.')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
      toast.success('Request sent! We\'ll be in touch shortly.')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHero
        tag="Walkthrough"
        title="See DutyProof in action."
        subtitle="Tell us about your operation and we'll walk you through exactly how DutyProof fits your workflow."
      />

      {/* Form section */}
      <section className="bg-slate-950 pb-20 border-b border-slate-800">
        <div className="max-w-lg mx-auto px-6">
          {submitted ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2
                className="text-2xl text-white mb-3"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                We got your request.
              </h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                We&apos;ll review your info and reach out within one business day to schedule your walkthrough.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50">
              {/* Header */}
              <div className="px-8 pt-8 pb-6 border-b border-slate-800">
                <h2
                  className="text-2xl text-white mb-2"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
                >
                  Request a walkthrough
                </h2>
                <p className="text-slate-500 text-sm">
                  No commitment. We&apos;ll show you the product, answer your questions, and help you decide if it&apos;s a fit.
                </p>
              </div>

              {/* Form */}
              <div className="px-8 py-7">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Company
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Phone
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                      What are you looking to solve? *
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
                      placeholder="Number of job sites, current fire watch process, what's not working..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-px disabled:translate-y-0 text-sm cta-pulse active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                        Sending…
                      </span>
                    ) : (
                      'Request Walkthrough →'
                    )}
                  </button>

                  <p className="text-center text-slate-600 text-xs mt-3">
                    We&apos;ll respond within one business day.
                  </p>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
