'use client'

import { useState } from 'react'

const CMS_DAILY_FINE = 21393

export default function CostCalculator() {
  const [facilities, setFacilities] = useState(3)

  const monthly = facilities * 149
  const annual = monthly * 12
  const daysToBreakEven = (annual / CMS_DAILY_FINE).toFixed(1)

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8">
      <div className="text-center mb-8">
        <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-2">Calculate your investment</p>
        <p className="text-slate-800 text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          How many facilities do you operate?
        </p>
      </div>

      {/* Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-500 text-sm">1</span>
          <span
            className="text-4xl font-extrabold text-blue-700"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {facilities} {facilities === 1 ? 'facility' : 'facilities'}
          </span>
          <span className="text-slate-500 text-sm">20</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={facilities}
          onChange={(e) => setFacilities(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Cost output */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Monthly</p>
          <p className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
            ${monthly.toLocaleString()}
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">$149 × {facilities}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Annual</p>
          <p className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
            ${annual.toLocaleString()}
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">per year</p>
        </div>
      </div>

      {/* Risk comparison */}
      <div className="rounded-xl bg-red-950/5 border border-red-200 p-4 text-center">
        <p className="text-red-600 text-xs font-bold uppercase tracking-widest mb-1">CMS immediate jeopardy fine</p>
        <p className="text-red-700 font-bold text-base">${CMS_DAILY_FINE.toLocaleString()}/day</p>
        <p className="text-slate-500 text-xs mt-2">
          DutyProof pays for itself if it prevents just{' '}
          <span className="font-bold text-slate-700">{daysToBreakEven} days</span>{' '}
          of CMS fines — less than one citation.
        </p>
      </div>
    </div>
  )
}
