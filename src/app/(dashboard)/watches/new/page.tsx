import CreateWatchForm from '@/components/CreateWatchForm'

function IconFire({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

export default function NewWatchPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200">
            <IconFire className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2
              className="text-xl sm:text-2xl text-slate-900 leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              New Fire Watch
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Set up and launch a new watch</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 sm:p-8 shadow-sm">
          <CreateWatchForm />
        </div>
      </div>
    </div>
  )
}
