'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'
import toast from 'react-hot-toast'

/* ── Icons ──────────────────────────────────────────────────── */

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/* ── Industry options ──────────────────────────────────────── */

const INDUSTRIES = [
  { value: '', label: 'Select your industry...' },
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'welding_contractor', label: 'Welding & Cutting Contractor' },
  { value: 'fire_department', label: 'Fire Department' },
  { value: 'roofing', label: 'Roofing Company' },
  { value: 'mechanical_contractor', label: 'Mechanical / HVAC Contractor' },
  { value: 'electrical_contractor', label: 'Electrical Contractor' },
  { value: 'plumbing', label: 'Plumbing & Pipefitting' },
  { value: 'demolition', label: 'Demolition Contractor' },
  { value: 'steel_fabrication', label: 'Steel Fabrication & Erection' },
  { value: 'shipyard', label: 'Shipyard & Marine' },
  { value: 'oil_gas', label: 'Oil & Gas' },
  { value: 'refinery_petrochemical', label: 'Refinery & Petrochemical' },
  { value: 'power_plant', label: 'Power Plant & Utilities' },
  { value: 'manufacturing', label: 'Manufacturing Facility' },
  { value: 'warehouse_logistics', label: 'Warehouse & Logistics' },
  { value: 'commercial_property', label: 'Commercial Property Management' },
  { value: 'hospital_healthcare', label: 'Hospital & Healthcare' },
  { value: 'university_education', label: 'University & Education' },
  { value: 'data_center', label: 'Data Center' },
  { value: 'mining', label: 'Mining & Quarry' },
  { value: 'aerospace_defense', label: 'Aerospace & Defense' },
  { value: 'film_entertainment', label: 'Film & Entertainment' },
  { value: 'insurance', label: 'Insurance Provider' },
  { value: 'fire_protection', label: 'Fire Protection & Sprinkler' },
  { value: 'safety_consulting', label: 'Safety Consulting' },
  { value: 'other', label: 'Other' },
]

/* ── Company size options ──────────────────────────────────── */

const COMPANY_SIZES = [
  { value: '', label: 'How big is your team?' },
  { value: '1-5', label: '1–5 people' },
  { value: '6-25', label: '6–25 people' },
  { value: '26-100', label: '26–100 people' },
  { value: '101-500', label: '101–500 people' },
  { value: '500+', label: '500+ people' },
]

/* ── Signup Form ────────────────────────────────────────────── */

function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [industryOther, setIndustryOther] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          industry: industry === 'other' ? industryOther.trim() : industry,
          company_size: companySize,
        },
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Check your email to verify, then set up your subscription.', { duration: 6000 })
      router.push('/billing')
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthColor = ['', 'bg-red-500', 'bg-amber-400', 'bg-emerald-400']
  const strengthLabel = ['', 'Too short', 'Good', 'Strong']

  const inputClass = `w-full px-4 py-3.5 bg-slate-800/60 border-2 border-slate-700/60 rounded-xl text-white text-sm
    placeholder:text-slate-600
    focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
    transition-all duration-200`

  const labelClass = 'block text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2'

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(ellipse, #1d4ed8 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(ellipse, #ea580c 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-[420px]">
        {/* Logo — centered above card */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="block">
            <BrandLogo className="w-[180px] h-auto mx-auto block" variant="light" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/95 border border-slate-800/80 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 sm:px-10 pt-9 pb-6 text-center">
            <h1
              className="text-2xl text-white leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Create your account
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">Start protecting your job sites in minutes</p>
          </div>

          {/* Form */}
          <div className="px-8 sm:px-10 pb-9">
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Name + Email row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fullName" className={labelClass}>Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    autoFocus
                    className={inputClass}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className={labelClass}>Company</label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    autoComplete="organization"
                    className={inputClass}
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              {/* Industry dropdown */}
              <div>
                <label htmlFor="industry" className={labelClass}>Industry</label>
                <div className="relative">
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    required
                    className={`${inputClass} appearance-none pr-10 ${!industry ? 'text-slate-600' : 'text-white'}`}
                  >
                    {INDUSTRIES.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                {industry === 'other' && (
                  <input
                    type="text"
                    value={industryOther}
                    onChange={(e) => setIndustryOther(e.target.value)}
                    required
                    className={`${inputClass} mt-2`}
                    placeholder="Tell us your industry..."
                    autoFocus
                  />
                )}
              </div>

              {/* Company size */}
              <div>
                <label htmlFor="companySize" className={labelClass}>Team Size</label>
                <div className="relative">
                  <select
                    id="companySize"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    required
                    className={`${inputClass} appearance-none pr-10 ${!companySize ? 'text-slate-600' : 'text-white'}`}
                  >
                    {COMPANY_SIZES.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className={labelClass}>Work Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                  placeholder="you@company.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`${inputClass} pr-12`}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <IconEyeOff className="w-4 h-4" />
                    ) : (
                      <IconEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : 'bg-slate-700'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold ${
                      strength === 1 ? 'text-red-400' : strength === 2 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || (password.length > 0 && password.length < 8)}
                className="w-full mt-2 py-4 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500
                  text-white font-bold rounded-xl text-sm
                  shadow-lg shadow-blue-600/20 disabled:shadow-none
                  transition-all duration-200
                  hover:-translate-y-0.5 disabled:translate-y-0
                  active:scale-[0.98]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account
                    <IconArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              <p className="text-center text-slate-600 text-[11px] mt-3 leading-relaxed">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-slate-400 hover:text-slate-300 underline underline-offset-2 transition-colors">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-slate-400 hover:text-slate-300 underline underline-offset-2 transition-colors">Privacy Policy</Link>.
              </p>
            </form>

            {/* Sign in link */}
            <div className="mt-7 pt-5 border-t border-slate-800/60 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="flex justify-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-xs font-medium transition-colors group"
          >
            <IconArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <SignupForm />
}
