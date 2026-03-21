import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { formatInTimeZone } from 'date-fns-tz'
import type { WatchWithFacility, CheckIn, Alert, WatchChecklistItem, ChecklistCompletion } from '@/types/database'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    paddingBottom: 60,
    color: '#1a1a1a',
  },
  // Header
  header: {
    marginBottom: 24,
    borderBottomWidth: 3,
    borderBottomColor: '#1e3a5f',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#e85c0d',
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  headerMeta: {
    fontSize: 8,
    color: '#666',
    marginTop: 6,
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    backgroundColor: '#f0f4f8',
    padding: '6 8',
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e85c0d',
  },
  // Two-column grid
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontFamily: 'Helvetica-Bold',
    color: '#444',
  },
  value: {
    flex: 1,
    color: '#1a1a1a',
  },
  // Compliance score
  scoreBox: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },
  scoreLabel: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
    marginRight: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  timelineDetail: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  // Activity log (compact variant)
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
    marginRight: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  activityTime: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  activityLabel: {
    fontSize: 8,
    color: '#1e3a5f',
    fontFamily: 'Helvetica-Bold',
    marginTop: 1,
  },
  activityMessage: {
    fontSize: 8,
    color: '#666',
    marginTop: 1,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#888',
  },
})

interface ReportData {
  watch: WatchWithFacility
  checkIns: CheckIn[]
  alerts: Alert[]
  checklistItems: WatchChecklistItem[]
  checklistCompletions: ChecklistCompletion[]
  adminEmail: string
}

function formatTs(ts: string | null, tz: string): string {
  if (!ts) return '—'
  try {
    return formatInTimeZone(new Date(ts), tz, 'MMM d, yyyy h:mm:ss a')
  } catch {
    return ts
  }
}

function calcDuration(start: string, end: string | null): string {
  if (!end) return 'In progress'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

/** Convert lat/lon to OSM tile x,y at a given zoom */
function latLonToTile(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lon + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n)
  return { x, y }
}

/** Build a 2x2 grid of OSM tile URLs centered on a lat/lon */
function getMapTileUrls(lat: number, lon: number): string[] {
  const zoom = 16
  const { x, y } = latLonToTile(lat, lon, zoom)
  return [
    `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
    `https://tile.openstreetmap.org/${zoom}/${x + 1}/${y}.png`,
    `https://tile.openstreetmap.org/${zoom}/${x}/${y + 1}.png`,
    `https://tile.openstreetmap.org/${zoom}/${x + 1}/${y + 1}.png`,
  ]
}

/** Helper: create a row (label + value) only if the value is truthy */
function condRow(labelText: string, valueText: string | null | undefined | false) {
  if (!valueText) return null
  return React.createElement(
    View,
    { style: styles.row },
    React.createElement(Text, { style: styles.label }, labelText),
    React.createElement(Text, { style: styles.value }, valueText)
  )
}

/** Map alert types to human-readable labels for the activity log */
const ACTIVITY_LABELS: Record<string, string> = {
  watch_started: 'Watch started',
  watch_ended: 'Watch ended',
  missed_checkin: 'Missed check-in escalation',
  watcher_offline: 'Watcher offline detected',
  watcher_online: 'Watcher back online',
  escalation_acknowledged: 'Escalation acknowledged',
  offline_reconciled: 'Offline check-in reconciled',
  late_recovery: 'Late check-in recovered',
}

/** Color for activity dots based on alert type */
function activityDotColor(alertType: string, message: string | null): string {
  if (message && message.includes('[HANDOFF]')) return '#8b5cf6'
  switch (alertType) {
    case 'watch_started': return '#16a34a'
    case 'watch_ended': return '#1e3a5f'
    case 'missed_checkin': return '#dc2626'
    case 'watcher_offline': return '#dc2626'
    case 'watcher_online': return '#16a34a'
    case 'escalation_acknowledged': return '#d97706'
    case 'offline_reconciled': return '#0ea5e9'
    case 'late_recovery': return '#d97706'
    default: return '#9ca3af'
  }
}

export function WatchReport({ watch, checkIns, alerts, checklistItems, checklistCompletions, adminEmail }: ReportData) {
  const completed = checkIns.filter((c) => c.status === 'completed')
  const missed = checkIns.filter((c) => c.status === 'missed')
  const total = completed.length + missed.length
  const pct = total > 0 ? Math.round((completed.length / total) * 100) : 100
  const reportId = watch.id.slice(0, 8).toUpperCase()
  const tz = watch.facilities.timezone || 'America/New_York'

  const watchTypeLabel = watch.watch_type === 'impairment' ? 'Impairment Watch' : 'Hot Work Fire Watch'

  // Filter alerts for activity log
  const activityAlerts = alerts.filter((a) => {
    if (ACTIVITY_LABELS[a.alert_type]) return true
    if (a.message && a.message.includes('[HANDOFF]')) return true
    return false
  }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Sorted, non-cancelled check-ins for the timeline
  const timelineCheckIns = checkIns
    .filter((c) => c.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())

  // GPS data for coverage map
  const gpsCheckins = completed.filter((c) => c.latitude != null && c.longitude != null)
  const ackCheckins = missed.filter((c) => c.ack_at && c.ack_latitude != null && c.ack_longitude != null)

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'LETTER', style: styles.page, wrap: true },

      // ── Header ──
      React.createElement(
        View,
        { style: styles.header, fixed: true },
        React.createElement(Text, { style: styles.headerTitle }, 'DUTYPROOF'),
        React.createElement(Text, { style: styles.headerSubtitle }, 'Fire Watch Compliance Report'),
        React.createElement(
          Text,
          { style: styles.headerMeta },
          `Report ID: ${reportId}  |  Generated: ${formatInTimeZone(new Date(), tz, 'MMM d, yyyy h:mm a')}  |  Immutable records — tamper-evident`
        )
      ),

      // ── Job Site Information ──
      React.createElement(
        View,
        { style: styles.section, wrap: true },
        React.createElement(Text, { style: styles.sectionTitle }, 'JOB SITE INFORMATION'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Job Site / Company:'),
          React.createElement(Text, { style: styles.value }, watch.facilities.name)
        ),
        condRow('Address:', watch.facilities.address),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Timezone:'),
          React.createElement(Text, { style: styles.value }, watch.facilities.timezone)
        )
      ),

      // ── Watch Summary ──
      React.createElement(
        View,
        { style: styles.section, wrap: true },
        React.createElement(Text, { style: styles.sectionTitle }, 'WATCH SUMMARY'),
        condRow('Watch Type:', watchTypeLabel),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Reason for Watch:'),
          React.createElement(Text, { style: styles.value }, watch.reason || 'Not specified')
        ),
        condRow('Location / Area:', watch.location),
        condRow('Permit #:', watch.permit_number),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Fire Watcher:'),
          React.createElement(Text, { style: styles.value }, `${watch.assigned_name} (${watch.assigned_phone})`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Check-in Interval:'),
          React.createElement(Text, { style: styles.value }, `Every ${watch.check_interval_min} minutes`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Watch Started:'),
          React.createElement(Text, { style: styles.value }, formatTs(watch.start_time, tz))
        ),
        condRow('Planned End:', watch.planned_end_time ? formatTs(watch.planned_end_time, tz) : null),
        condRow('Work Stopped At:', watch.work_stopped_at ? formatTs(watch.work_stopped_at, tz) : null),
        condRow('Post-Work Monitoring:', watch.post_work_duration_min > 0 ? `${watch.post_work_duration_min} minutes` : null),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Watch Ended:'),
          React.createElement(Text, { style: styles.value }, watch.ended_at ? formatTs(watch.ended_at, tz) : 'Still Active')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Duration:'),
          React.createElement(Text, { style: styles.value }, calcDuration(watch.start_time, watch.ended_at))
        ),
        watch.ended_at
          ? React.createElement(
              View,
              { style: styles.row },
              React.createElement(Text, { style: styles.label }, 'Closed By:'),
              React.createElement(Text, { style: styles.value }, adminEmail)
            )
          : null
      ),

      // ── Compliance Summary ──
      React.createElement(
        View,
        { style: styles.section, wrap: true },
        React.createElement(Text, { style: styles.sectionTitle }, 'COMPLIANCE SUMMARY'),
        React.createElement(
          View,
          { style: styles.scoreBox },
          React.createElement(
            View,
            { style: styles.scoreCard },
            React.createElement(Text, { style: [styles.scoreNumber, { color: '#16a34a' }] }, `${pct}%`),
            React.createElement(Text, { style: styles.scoreLabel }, 'COMPLIANCE RATE')
          ),
          React.createElement(
            View,
            { style: styles.scoreCard },
            React.createElement(Text, { style: [styles.scoreNumber, { color: '#16a34a' }] }, String(completed.length)),
            React.createElement(Text, { style: styles.scoreLabel }, 'CHECK-INS COMPLETED')
          ),
          React.createElement(
            View,
            { style: styles.scoreCard },
            React.createElement(Text, { style: [styles.scoreNumber, { color: missed.length > 0 ? '#dc2626' : '#1a1a1a' }] }, String(missed.length)),
            React.createElement(Text, { style: styles.scoreLabel }, 'CHECK-INS MISSED')
          ),
          React.createElement(
            View,
            { style: styles.scoreCard },
            React.createElement(Text, { style: [styles.scoreNumber, { color: '#1e3a5f' }] }, String(alerts.filter(a => a.alert_type === 'missed_checkin').length)),
            React.createElement(Text, { style: styles.scoreLabel }, 'ALERTS SENT')
          ),
          React.createElement(
            View,
            { style: styles.scoreCard },
            React.createElement(Text, { style: [styles.scoreNumber, { color: '#d97706' }] }, String(missed.filter(c => c.ack_at).length)),
            React.createElement(Text, { style: styles.scoreLabel }, 'ACKNOWLEDGED')
          )
        )
      ),

      // ── Closeout Evidence (only for completed watches) ──
      ...(watch.ended_at
        ? [
            React.createElement(
              View,
              { style: styles.section, wrap: true },
              React.createElement(Text, { style: styles.sectionTitle }, 'CLOSEOUT EVIDENCE'),
              React.createElement(
                View,
                { style: styles.row },
                React.createElement(Text, { style: styles.label }, 'Closeout Notes:'),
                React.createElement(Text, { style: styles.value }, watch.closeout_notes || 'None recorded')
              ),
              React.createElement(
                View,
                { style: styles.row },
                React.createElement(Text, { style: styles.label }, 'Closeout Photos:'),
                React.createElement(
                  Text,
                  { style: styles.value },
                  watch.closeout_photo_urls && watch.closeout_photo_urls.length > 0
                    ? `${watch.closeout_photo_urls.length} photo${watch.closeout_photo_urls.length === 1 ? '' : 's'} attached`
                    : 'None'
                )
              ),
              // Impairment-specific restoration fields
              ...(watch.watch_type === 'impairment'
                ? [
                    React.createElement(
                      View,
                      { style: styles.row },
                      React.createElement(Text, { style: styles.label }, 'System Restored:'),
                      React.createElement(
                        Text,
                        { style: [styles.value, { color: watch.system_restored ? '#16a34a' : '#dc2626', fontFamily: 'Helvetica-Bold' }] },
                        watch.system_restored ? 'Yes' : 'No'
                      )
                    ),
                    condRow('Verified By:', watch.restoration_verified_by),
                    condRow('Verified At:', watch.restoration_verified_at ? formatTs(watch.restoration_verified_at, tz) : null),
                  ]
                : [])
            ),
          ]
        : []),

      // ── GPS Coverage Map ──
      ...(gpsCheckins.length > 0
        ? (() => {
            const avgLat = gpsCheckins.reduce((s, c) => s + c.latitude!, 0) / gpsCheckins.length
            const avgLon = gpsCheckins.reduce((s, c) => s + c.longitude!, 0) / gpsCheckins.length
            const tiles = getMapTileUrls(avgLat, avgLon)
            const avgAccuracy = gpsCheckins.reduce((s, c) => s + (c.gps_accuracy ?? 0), 0) / gpsCheckins.length
            return [
              React.createElement(
                View,
                { style: styles.section, wrap: true },
                React.createElement(Text, { style: styles.sectionTitle }, 'GPS COVERAGE MAP'),
                React.createElement(
                  View,
                  { style: { flexDirection: 'row', flexWrap: 'wrap', width: 300, height: 300, alignSelf: 'center', marginTop: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, overflow: 'hidden' } },
                  ...tiles.map((url, i) =>
                    React.createElement(Image, { key: String(i), src: url, style: { width: 150, height: 150 } })
                  )
                ),
                React.createElement(
                  Text,
                  { style: { fontSize: 8, color: '#666', textAlign: 'center', marginTop: 4 } },
                  `Center: ${avgLat.toFixed(5)}, ${avgLon.toFixed(5)}  |  ${gpsCheckins.length} GPS-verified check-in(s)  |  Avg accuracy: ±${avgAccuracy.toFixed(0)}m`
                ),
                React.createElement(
                  Text,
                  { style: { fontSize: 7, color: '#999', textAlign: 'center', marginTop: 3 } },
                  'Map data © OpenStreetMap contributors'
                )
              ),
            ]
          })()
        : []),

      // ── Supervisor Acknowledgment Map ──
      ...(ackCheckins.length > 0
        ? (() => {
            const avgLat = ackCheckins.reduce((s, c) => s + c.ack_latitude!, 0) / ackCheckins.length
            const avgLon = ackCheckins.reduce((s, c) => s + c.ack_longitude!, 0) / ackCheckins.length
            const tiles = getMapTileUrls(avgLat, avgLon)
            const avgAccuracy = ackCheckins.reduce((s, c) => s + (c.ack_gps_accuracy ?? 0), 0) / ackCheckins.length
            return [
              React.createElement(
                View,
                { style: styles.section, wrap: true },
                React.createElement(Text, { style: styles.sectionTitle }, 'SUPERVISOR ACKNOWLEDGMENT MAP'),
                React.createElement(
                  View,
                  { style: { flexDirection: 'row', flexWrap: 'wrap', width: 300, height: 300, alignSelf: 'center', marginTop: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, overflow: 'hidden' } },
                  ...tiles.map((url, i) =>
                    React.createElement(Image, { key: String(i), src: url, style: { width: 150, height: 150 } })
                  )
                ),
                React.createElement(
                  Text,
                  { style: { fontSize: 8, color: '#666', textAlign: 'center', marginTop: 4 } },
                  `Center: ${avgLat.toFixed(5)}, ${avgLon.toFixed(5)}  |  ${ackCheckins.length} GPS-verified acknowledgment(s)  |  Avg accuracy: ±${avgAccuracy.toFixed(0)}m`
                ),
                React.createElement(
                  Text,
                  { style: { fontSize: 7, color: '#999', textAlign: 'center', marginTop: 3 } },
                  'Map data © OpenStreetMap contributors'
                )
              ),
            ]
          })()
        : []),

      // ── Check-In Timeline ──
      React.createElement(
        View,
        { style: styles.section, wrap: true },
        React.createElement(Text, { style: styles.sectionTitle }, 'CHECK-IN TIMELINE'),
        ...timelineCheckIns.map((ci) => {
          const offlineTag = ci.completed_offline ? ' (OFFLINE)' : ''
          const statusText = `${formatTs(ci.scheduled_time, tz)}  —  ${ci.status.toUpperCase()}${offlineTag}`

          return React.createElement(
            View,
            { key: ci.id, style: styles.timelineRow, wrap: false },
            React.createElement(View, {
              style: [
                styles.statusDot,
                {
                  backgroundColor:
                    ci.status === 'completed'
                      ? '#16a34a'
                      : ci.status === 'missed'
                      ? '#dc2626'
                      : '#9ca3af',
                },
              ],
            }),
            React.createElement(
              View,
              { style: styles.timelineContent },
              React.createElement(
                Text,
                { style: styles.timelineTime },
                statusText
              ),
              // Completed check-in details
              ci.status === 'completed' && ci.completed_at
                ? React.createElement(
                    Text,
                    { style: styles.timelineDetail },
                    `Device time: ${formatTs(ci.completed_at, tz)}  |  Server received: ${formatTs(ci.server_received_at, tz)}` +
                    (ci.latitude ? `  |  GPS: ${ci.latitude.toFixed(5)}, ${ci.longitude?.toFixed(5)} (±${ci.gps_accuracy?.toFixed(0)}m)` : '  |  GPS: Not captured')
                  )
                : null,
              // Missed check-in details
              ci.status === 'missed'
                ? React.createElement(
                    View,
                    null,
                    React.createElement(
                      Text,
                      { style: styles.timelineDetail },
                      'Scheduled window expired. Escalation sent to supervisor.'
                    ),
                    ci.ack_at
                      ? React.createElement(
                          Text,
                          { style: [styles.timelineDetail, { color: '#d97706' }] },
                          `Supervisor acknowledged: ${formatTs(ci.ack_at, tz)}` +
                          (ci.ack_latitude
                            ? `  |  GPS: ${ci.ack_latitude.toFixed(5)}, ${ci.ack_longitude?.toFixed(5)} (±${ci.ack_gps_accuracy?.toFixed(0)}m)`
                            : '')
                        )
                      : ci.escalation_sent_at
                        ? React.createElement(
                            Text,
                            { style: [styles.timelineDetail, { color: '#9ca3af', fontStyle: 'italic' }] },
                            'Awaiting supervisor acknowledgment'
                          )
                        : null
                  )
                : null,
              // Notes (for any status)
              ci.notes
                ? React.createElement(
                    Text,
                    { style: [styles.timelineDetail, { fontStyle: 'italic' }] },
                    `Note: ${ci.notes}`
                  )
                : null
            )
          )
        })
      ),

      // ── Activity Log ──
      ...(activityAlerts.length > 0
        ? [
            React.createElement(
              View,
              { style: styles.section, wrap: true },
              React.createElement(Text, { style: styles.sectionTitle }, 'ACTIVITY LOG'),
              ...activityAlerts.map((a) => {
                const isHandoff = a.message && a.message.includes('[HANDOFF]')
                const label = isHandoff ? 'Watcher handoff' : (ACTIVITY_LABELS[a.alert_type] || a.alert_type)
                const dotColor = activityDotColor(a.alert_type, a.message)

                return React.createElement(
                  View,
                  { key: a.id, style: styles.activityRow, wrap: false },
                  React.createElement(View, {
                    style: [styles.activityDot, { backgroundColor: dotColor }],
                  }),
                  React.createElement(
                    View,
                    { style: styles.timelineContent },
                    React.createElement(
                      Text,
                      { style: styles.activityTime },
                      formatTs(a.created_at, tz)
                    ),
                    React.createElement(
                      Text,
                      { style: styles.activityLabel },
                      label
                    ),
                    a.message
                      ? React.createElement(
                          Text,
                          { style: styles.activityMessage },
                          a.message
                        )
                      : null
                  )
                )
              })
            ),
          ]
        : []),

      // ── Pre-Watch Safety Checklist ──
      ...(checklistItems.length > 0
        ? [
            React.createElement(
              View,
              { style: styles.section, wrap: true },
              React.createElement(Text, { style: styles.sectionTitle }, 'PRE-WATCH SAFETY CHECKLIST'),
              React.createElement(
                View,
                { style: styles.row },
                React.createElement(Text, { style: styles.label }, 'Status:'),
                React.createElement(Text, { style: styles.value }, watch.checklist_completed_at ? `Completed ${formatTs(watch.checklist_completed_at, tz)}` : 'Not completed')
              ),
              ...checklistItems.map((item) => {
                const completion = checklistCompletions.find((c) => c.item_id === item.id)
                return React.createElement(
                  View,
                  { key: item.id, style: styles.timelineRow, wrap: false },
                  React.createElement(View, {
                    style: [styles.statusDot, { backgroundColor: completion ? '#16a34a' : '#dc2626' }],
                  }),
                  React.createElement(
                    View,
                    { style: styles.timelineContent },
                    React.createElement(Text, { style: styles.timelineTime }, item.label),
                    completion
                      ? React.createElement(Text, { style: styles.timelineDetail },
                          `Completed: ${formatTs(completion.completed_at, tz)}` +
                          (item.requires_photo ? (completion.photo_url ? '  |  Photo: Attached' : '  |  Photo: Missing') : '')
                        )
                      : React.createElement(Text, { style: [styles.timelineDetail, { color: '#dc2626' }] }, 'Not completed')
                  )
                )
              })
            ),
          ]
        : []),

      // ── Footer (fixed on every page) ──
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          Text,
          { style: styles.footerText },
          `DutyProof Fire Watch Compliance Report  |  Report ID: ${reportId}  |  All times in ${tz}`
        ),
        React.createElement(Text, {
          style: styles.footerText,
          render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} of ${totalPages}`,
        })
      )
    )
  )
}
