import { format } from 'date-fns'
import type { CheckIn, Alert } from '@/types/database'

interface CheckInTimelineProps {
  checkIns: CheckIn[]
  alerts: Alert[]
}

export default function CheckInTimeline({ checkIns, alerts }: CheckInTimelineProps) {
  const sorted = [...checkIns]
    .filter((c) => c.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        No check-ins recorded yet.
      </div>
    )
  }

  function formatTs(ts: string | null): string {
    if (!ts) return '—'
    return format(new Date(ts), 'MMM d, h:mm:ss a')
  }

  function getAlertForCheckIn(checkInId: string): Alert | undefined {
    return alerts.find((a) => a.check_in_id === checkInId && a.alert_type === 'missed_checkin')
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-slate-200 via-slate-200 to-slate-100 rounded-full" />

      <ol className="space-y-2">
        {sorted.map((ci) => {
          const alert = ci.status === 'missed' ? getAlertForCheckIn(ci.id) : undefined
          return (
            <li key={ci.id} className="relative flex gap-4 py-1.5">
              {/* Timeline dot */}
              <div className={`relative z-10 mt-1 w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm ${
                ci.status === 'completed'
                  ? 'bg-green-500 text-white ring-[3px] ring-green-100'
                  : ci.status === 'missed'
                  ? 'bg-red-500 text-white ring-[3px] ring-red-100'
                  : 'bg-slate-200 text-slate-500 ring-[3px] ring-slate-50'
              }`}>
                {ci.status === 'completed' ? '✓' : ci.status === 'missed' ? '✕' : '…'}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 rounded-xl p-4 border transition-colors ${
                ci.status === 'completed'
                  ? 'bg-green-50/50 border-green-100 hover:bg-green-50/80'
                  : ci.status === 'missed'
                  ? 'bg-red-50/50 border-red-100 hover:bg-red-50/80'
                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50/80'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {format(new Date(ci.scheduled_time), 'h:mm a')}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    ci.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : ci.status === 'missed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {ci.status}
                  </span>
                </div>

                {ci.status === 'completed' && (
                  <div className="space-y-1 text-xs text-slate-500 mt-2.5">
                    {ci.completed_offline && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold mb-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4" /></svg>
                        Completed offline — synced later
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Completed: {formatTs(ci.completed_at)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>
                      Server: {formatTs(ci.server_received_at)}
                    </div>
                    {ci.latitude ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${ci.latitude}&mlon=${ci.longitude}#map=17/${ci.latitude}/${ci.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 transition-colors group bg-green-50 px-2 py-1 rounded-lg -ml-0.5"
                      >
                        <svg className="w-3.5 h-3.5 text-green-500 group-hover:text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-mono text-[11px]">{ci.latitude.toFixed(5)}, {ci.longitude?.toFixed(5)}</span>
                        {ci.gps_accuracy && <span className="text-green-400 text-[10px]">({'\u00B1'}{ci.gps_accuracy.toFixed(0)}m)</span>}
                      </a>
                    ) : (
                      <div className="text-amber-500">GPS: Not captured</div>
                    )}
                    {ci.notes && (
                      <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                        <span className="font-semibold text-blue-600">Note:</span> {ci.notes}
                      </div>
                    )}
                  </div>
                )}

                {ci.status === 'missed' && (
                  <div className="text-xs text-red-600 mt-2.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Window expired: {formatTs(ci.token_expires_at)}
                    </div>
                    {alert && (
                      <div className="text-slate-500">Alert sent: {formatTs(alert.created_at)}</div>
                    )}
                    {ci.ack_at ? (
                      <div className="text-amber-600 font-medium">
                        Supervisor acknowledged: {formatTs(ci.ack_at)}
                        {ci.ack_latitude != null && (
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${ci.ack_latitude}&mlon=${ci.ack_longitude}#map=17/${ci.ack_latitude}/${ci.ack_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-600 font-normal transition-colors ml-1"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-mono text-[11px]">{ci.ack_latitude.toFixed(5)}, {ci.ack_longitude?.toFixed(5)}</span>
                          </a>
                        )}
                      </div>
                    ) : ci.escalation_sent_at ? (
                      <div className="text-slate-500 italic">Awaiting supervisor acknowledgment</div>
                    ) : null}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
