'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import PageHero from '@/components/PageHero'

const TOPICS = [
  {
    q: 'A worker isn\'t receiving their check-in SMS.',
    a: 'First confirm the phone number is correct on the watch detail page. SMS delivery can be delayed by carrier filtering on some numbers — particularly VOIP lines or numbers with spam-block services enabled. If the number is correct and delivery is failing, reach out through the form above and we\'ll investigate the carrier logs.',
  },
  {
    q: 'How do I add or remove a job site?',
    a: 'Go to Job Sites in the sidebar. You can add new job sites and manage existing ones there. Your subscription covers unlimited job sites at a flat rate — there are no per-site fees. Removing a job site (deactivating all its watches) does not change your billing.',
  },
  {
    q: 'Can I download a PDF report for a watch that\'s still active?',
    a: 'Reports are generated when a watch ends. While a watch is active, you can view the full check-in timeline on the watch detail page. End the watch to generate the downloadable PDF compliance report.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your records are retained for the life of your account. After cancellation, compliance records and PDF reports remain downloadable for 12 months. After that period, data is deleted from our servers. We strongly recommend downloading reports for any watches that may be subject to future inspection before cancelling.',
  },
  {
    q: 'I need to set up multiple simultaneous watches at the same job site.',
    a: 'Supported. Start a new watch for each location or worker — you can run as many concurrent watches as needed within the same job site. Each watch has its own check-in interval, worker, and audit trail. All appear on your dashboard sorted by urgency.',
  },
]

const TOPIC_OPTIONS = [
  'Setup / getting started',
  'SMS delivery issue',
  'Billing / subscription',
  'PDF reports',
  'Technical issue',
  'Other',
]

function SupportForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/contact/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
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
      toast.success('Message sent! We\'ll get back to you shortly.')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border-2 border-green-200 bg-green-50/30 p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          className="text-2xl text-slate-900 mb-3"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
        >
          We got your message.
        </h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          We&apos;ll review your request and get back to you within one business day.
        </p>
        <button
          onClick={() => { setSubmitted(false); setName(''); setEmail(''); setTopic(''); setMessage('') }}
          className="text-blue-600 hover:text-blue-500 text-sm font-semibold transition-colors"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border-2 border-slate-200 p-7 sm:p-8">
      <h2
        className="text-xl text-slate-900 mb-1"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
      >
        Send us a message
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        We&apos;ll get back to you within one business day.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="support-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Name *
            </label>
            <input
              id="support-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="support-email" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Email *
            </label>
            <input
              id="support-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="you@company.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="support-topic" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Topic
          </label>
          <div className="relative">
            <select
              id="support-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm appearance-none"
            >
              <option value="">Select a topic...</option>
              {TOPIC_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>

        <div>
          <label htmlFor="support-message" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Message *
          </label>
          <textarea
            id="support-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
            placeholder="How can we help?"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-px disabled:translate-y-0 text-sm active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
              Sending…
            </span>
          ) : (
            'Send Message →'
          )}
        </button>
      </div>
    </form>
  )
}

export default function SupportPage() {
  return (
    <>
      <PageHero
        tag="Support"
        title="We're here when you need us."
        subtitle="When you reach out, you're talking to the team that built it — not a ticketing queue."
      />

      {/* ── Main content ── */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">

          {/* Contact form + info cards */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-16">
            {/* Form — takes 3 cols */}
            <div className="lg:col-span-3">
              <SupportForm />
            </div>

            {/* Info cards — takes 2 cols */}
            <div className="lg:col-span-2 space-y-5">
              {/* Response time */}
              <div className="rounded-2xl border-2 border-slate-200 p-7">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <h2 className="font-bold text-slate-900 text-base mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Response time
                </h2>
                <p className="text-slate-500 text-sm mb-4">
                  We respond within a few hours during business hours, Monday through Friday.
                </p>
                <div className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Typically same business day
                </div>
              </div>

              {/* Walkthrough */}
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/30 p-7">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <h2 className="font-bold text-slate-900 text-base mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Request a walkthrough
                </h2>
                <p className="text-slate-500 text-sm mb-4">
                  Want to see DutyProof in action? We&apos;ll walk you through the product and answer your questions.
                </p>
                <Link
                  href="/support/walkthrough"
                  className="text-blue-600 hover:text-blue-500 font-semibold text-sm transition-colors"
                >
                  Schedule a walkthrough →
                </Link>
              </div>
            </div>
          </div>

          {/* Common questions */}
          <div>
            <h2
              className="text-2xl text-slate-900 mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Common questions
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              Quick answers to the most frequent support topics. Don&apos;t see yours? Use the form above.
            </p>

            <div className="divide-y divide-slate-200">
              {TOPICS.map((item, i) => (
                <div key={i} className="py-5">
                  <p className="font-semibold text-slate-800 text-sm mb-2">{item.q}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* See also */}
          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Looking for product FAQs?</p>
              <p className="text-slate-500 text-xs mt-0.5">Pricing, compliance, intervals, and more are covered on the main page.</p>
            </div>
            <Link
              href="/#pricing"
              className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-xl transition-colors"
            >
              View FAQ & Pricing →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
