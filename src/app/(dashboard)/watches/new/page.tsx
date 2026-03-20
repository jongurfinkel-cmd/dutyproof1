import CreateWatchForm from '@/components/CreateWatchForm'

export default function NewWatchPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h2
            className="text-xl sm:text-2xl text-slate-900"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            New Fire Watch
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
          <CreateWatchForm />
        </div>
      </div>
    </div>
  )
}
