'use client'

import { useState } from 'react'

const AVG_HOTWORK_FIRE_DAMAGE = 292000

export default function CostCalculator() {
  const [sites, setSites] = useState(3)

  const monthly = sites * 99
  const annual = monthly * 12
  const pctOfOneFire = ((annual / AVG_HOTWORK_FIRE_DAMAGE) * 100).toFixed(1)

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8">
      <div className="text-center mb-8">
        <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-2">Calculate your investment</p>
        <p className="text-slate-800 text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          How many active job sites do you run?
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
            {sites} {sites === 1 ? 'job site' : 'job sites'}
          </span>
          <span className="text-slate-500 text-sm">20</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={sites}
          onChange={(e) => setSites(Number(e.target.value))}
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
          <p className="text-slate-400 text-[11px] mt-0.5">$99 × {sites}</p>
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
        <p className="text-red-600 text-xs font-bold uppercase tracking-widest mb-1">Avg hot work fire property damage</p>
        <p className="text-red-700 font-bold text-base">${AVG_HOTWORK_FIRE_DAMAGE.toLocaleString()} per incident</p>
        <p className="text-slate-500 text-xs mt-2">
          Your annual DutyProof cost is just{' '}
          <span className="font-bold text-slate-700">{pctOfOneFire}%</span>{' '}
          of the damage from a single hot work fire.
        </p>
      </div>
    </div>
  )
}
