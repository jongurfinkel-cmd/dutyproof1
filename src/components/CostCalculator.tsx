'use client'

const AVG_HOTWORK_FIRE_DAMAGE = 292000
const MONTHLY_COST = 199
const YEARLY_COST = MONTHLY_COST * 12

const risks = [
  { label: 'Single denied hot work claim', cost: 200000 },
  { label: 'OSHA hot work violation fine', cost: 16131 },
  { label: '20% premium increase on $50K GL policy', cost: 10000 },
  { label: 'Policy non-renewal (forced high-risk market)', cost: 27500 },
]

export default function CostCalculator() {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8">
      <div className="text-center mb-8">
        <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-2">The math that sells itself</p>
        <p className="text-slate-800 text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          DutyProof vs. the cost of not having proof
        </p>
      </div>

      {/* Cost summary */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 text-center mb-6">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">DutyProof</p>
        <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
          ${MONTHLY_COST}<span className="text-base font-bold text-slate-500">/mo</span>
        </p>
        <p className="text-slate-500 text-[11px] mt-0.5">flat rate · unlimited sites · cancel any time</p>
      </div>

      {/* ROI table */}
      <div className="space-y-2 mb-6">
        {risks.map((r) => {
          const roi = Math.round(r.cost / YEARLY_COST)
          return (
            <div key={r.label} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-slate-700 text-sm font-medium">{r.label}</p>
                <p className="text-red-600 text-xs font-bold">${r.cost.toLocaleString()}+</p>
              </div>
              <div className="text-right">
                <p className="text-green-700 text-lg font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>{roi}:1</p>
                <p className="text-slate-500 text-[10px]">ROI</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Risk comparison */}
      <div className="rounded-xl bg-red-950/5 border-2 border-red-200 p-6 text-center">
        <p className="text-red-600 text-xs font-bold uppercase tracking-widest mb-3">One hot work fire costs</p>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-5xl sm:text-6xl font-black text-red-600" style={{ fontFamily: 'var(--font-display)' }}>
            {Math.round(AVG_HOTWORK_FIRE_DAMAGE / YEARLY_COST)}x
          </span>
          <div className="text-left">
            <p className="text-slate-700 text-sm font-bold">a full year</p>
            <p className="text-slate-500 text-sm">of DutyProof</p>
          </div>
        </div>
        <p className="text-slate-500 text-xs">
          Average property damage: <span className="font-semibold text-slate-600">${AVG_HOTWORK_FIRE_DAMAGE.toLocaleString()}</span> per incident (NFPA)
        </p>
      </div>
    </div>
  )
}
