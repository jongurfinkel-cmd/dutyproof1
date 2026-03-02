'use client'

import dynamic from 'next/dynamic'
import type { CheckIn } from '@/types/database'

const CheckInMap = dynamic(() => import('./CheckInMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Check-In Locations
      </h3>
      <div className="w-full h-[300px] sm:h-[400px] rounded-xl bg-slate-50 animate-pulse" />
    </div>
  ),
})

export default function CheckInMapDynamic({ checkIns }: { checkIns: CheckIn[] }) {
  return <CheckInMap checkIns={checkIns} />
}
