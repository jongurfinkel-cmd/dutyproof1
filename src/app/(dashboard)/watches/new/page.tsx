import CreateWatchForm from '@/components/CreateWatchForm'

export default function NewWatchPage() {
  return (
    <div className="p-8 lg:p-10">
      <div className="mb-8">
        <h2
          className="text-3xl text-slate-900"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
        >
          Start New Fire Watch
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Fill in all required fields. The assigned person will receive an SMS with their first check-in link immediately.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm max-w-xl">
        <CreateWatchForm />
      </div>
    </div>
  )
}
