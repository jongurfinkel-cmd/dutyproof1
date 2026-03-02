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
      <div className="text-center py-12 text-slate-400 text-sm">
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
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-200" />

      <ol className="space-y-1">
        {sorted.map((ci) => {
          const alert = ci.status === 'missed' ? getAlertForCheckIn(ci.id) : undefined
          return (
            <li key={ci.id} className="relative flex gap-4 py-2">
              {/* Timeline dot */}
              <div className={`relative z-10 mt-0.5 w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                ci.status === 'completed'
                  ? 'bg-green-100 text-green-600 ring-4 ring-white'
                  : ci.status === 'missed'
                  ? 'bg-red-100 text-red-600 ring-4 ring-white'
                  : 'bg-slate-100 text-slate-400 ring-4 ring-white'
              }`}>
                {ci.status === 'completed' ? '✓' : ci.status === 'missed' ? '✕' : '…'}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 rounded-xl p-3.5 ${
                ci.status === 'completed'
                  ? 'bg-green-50/60'
                  : ci.status === 'missed'
                  ? 'bg-red-50/60'
                  : 'bg-slate-50'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {format(new Date(ci.scheduled_time), 'h:mm a')}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
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
                  <div className="space-y-0.5 text-xs text-slate-500 mt-2">
                    <div>Completed: {formatTs(ci.completed_at)}</div>
                    <div>Server: {formatTs(ci.server_received_at)}</div>
                    {ci.latitude ? (
                      <div className="text-green-600">
                        GPS: {ci.latitude.toFixed(5)}, {ci.longitude?.toFixed(5)}
                        {ci.gps_accuracy && ` (±${ci.gps_accuracy.toFixed(0)}m)`}
                      </div>
                    ) : (
                      <div className="text-amber-500">GPS: Not captured</div>
                    )}
                  </div>
                )}

                {ci.status === 'missed' && (
                  <div className="text-xs text-red-600 mt-2">
                    Window expired: {formatTs(ci.token_expires_at)}
                    {alert && (
                      <div className="text-slate-500 mt-0.5">Alert sent: {formatTs(alert.created_at)}</div>
                    )}
                    {ci.ack_at ? (
                      <div className="text-amber-600 mt-0.5 font-medium">
                        Supervisor acknowledged: {formatTs(ci.ack_at)}
                        {ci.ack_latitude != null && (
                          <span className="text-amber-500 font-normal">
                            {' '}| GPS: {ci.ack_latitude.toFixed(5)}, {ci.ack_longitude?.toFixed(5)}
                          </span>
                        )}
                      </div>
                    ) : ci.escalation_sent_at ? (
                      <div className="text-slate-400 mt-0.5 italic">Awaiting supervisor acknowledgment</div>
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
