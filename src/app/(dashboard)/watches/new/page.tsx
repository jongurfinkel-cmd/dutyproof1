import CreateWatchForm from '@/components/CreateWatchForm'

export default function NewWatchPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mb-8">
        <h2
          className="text-xl sm:text-3xl text-slate-900"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
        >
          Start New Fire Watch
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Fill in the required fields below. If SMS is enabled, the fire watcher will receive their first check-in link immediately.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-7 shadow-sm max-w-xl">
        <CreateWatchForm />
      </div>
    </div>
  )
}
