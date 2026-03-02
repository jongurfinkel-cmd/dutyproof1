import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import type { WatchWithFacility, CheckIn, Alert, WatchChecklistItem, ChecklistCompletion } from '@/types/database'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
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
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
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

function formatTs(ts: string | null): string {
  if (!ts) return '—'
  try {
    return format(new Date(ts), 'MMM d, yyyy h:mm:ss a')
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

export function WatchReport({ watch, checkIns, alerts, checklistItems, checklistCompletions, adminEmail }: ReportData) {
  const completed = checkIns.filter((c) => c.status === 'completed')
  const missed = checkIns.filter((c) => c.status === 'missed')
  const total = completed.length + missed.length
  const pct = total > 0 ? Math.round((completed.length / total) * 100) : 100
  const reportId = watch.id.slice(0, 8).toUpperCase()

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'LETTER', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, 'DUTYPROOF'),
        React.createElement(Text, { style: styles.headerSubtitle }, 'Fire Watch Compliance Report'),
        React.createElement(
          Text,
          { style: styles.headerMeta },
          `Report ID: ${reportId}  |  Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}  |  Immutable records — tamper-evident`
        )
      ),
      // Facility Info
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'JOB SITE INFORMATION'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Job Site / Company:'),
          React.createElement(Text, { style: styles.value }, watch.facilities.name)
        ),
        watch.facilities.address &&
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, 'Address:'),
            React.createElement(Text, { style: styles.value }, watch.facilities.address)
          ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Timezone:'),
          React.createElement(Text, { style: styles.value }, watch.facilities.timezone)
        )
      ),
      // Watch Summary
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'WATCH SUMMARY'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Reason for Watch:'),
          React.createElement(Text, { style: styles.value }, watch.reason || 'Not specified')
        ),
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
          React.createElement(Text, { style: styles.value }, formatTs(watch.start_time))
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Watch Ended:'),
          React.createElement(Text, { style: styles.value }, watch.ended_at ? formatTs(watch.ended_at) : 'Still Active')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Duration:'),
          React.createElement(Text, { style: styles.value }, calcDuration(watch.start_time, watch.ended_at))
        ),
        watch.ended_at &&
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, 'Closed By:'),
            React.createElement(Text, { style: styles.value }, adminEmail)
          )
      ),
      // Compliance Score
      React.createElement(
        View,
        { style: styles.section },
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
          )
        )
      ),
      // GPS Coverage Map — show area map when GPS data is available
      ...(() => {
        const gpsCheckins = completed.filter((c) => c.latitude != null && c.longitude != null)
        if (gpsCheckins.length === 0) return []
        const avgLat = gpsCheckins.reduce((s, c) => s + c.latitude!, 0) / gpsCheckins.length
        const avgLon = gpsCheckins.reduce((s, c) => s + c.longitude!, 0) / gpsCheckins.length
        const tiles = getMapTileUrls(avgLat, avgLon)
        const avgAccuracy = gpsCheckins.reduce((s, c) => s + (c.gps_accuracy ?? 0), 0) / gpsCheckins.length
        return [
          React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, 'GPS COVERAGE MAP'),
            React.createElement(
              View,
              { style: { flexDirection: 'row', flexWrap: 'wrap', width: 300, height: 300, alignSelf: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 4, overflow: 'hidden' } },
              ...tiles.map((url, i) =>
                React.createElement(Image, { key: String(i), src: url, style: { width: 150, height: 150 } })
              )
            ),
            React.createElement(
              Text,
              { style: { fontSize: 8, color: '#666', textAlign: 'center', marginTop: 6 } },
              `Center: ${avgLat.toFixed(5)}, ${avgLon.toFixed(5)}  |  ${gpsCheckins.length} GPS-verified check-in(s)  |  Avg accuracy: ±${avgAccuracy.toFixed(0)}m`
            ),
            React.createElement(
              Text,
              { style: { fontSize: 7, color: '#999', textAlign: 'center', marginTop: 2 } },
              'Map data © OpenStreetMap contributors'
            )
          ),
        ]
      })(),
      // Check-In Timeline
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'CHECK-IN TIMELINE'),
        ...checkIns
          .filter((c) => c.status !== 'cancelled')
          .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
          .map((ci) =>
            React.createElement(
              View,
              { key: ci.id, style: styles.timelineRow },
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
                  `${formatTs(ci.scheduled_time)}  —  ${ci.status.toUpperCase()}`
                ),
                ci.status === 'completed' && ci.completed_at &&
                  React.createElement(
                    Text,
                    { style: styles.timelineDetail },
                    `Device time: ${formatTs(ci.completed_at)}  |  Server received: ${formatTs(ci.server_received_at)}` +
                    (ci.latitude ? `  |  GPS: ${ci.latitude.toFixed(5)}, ${ci.longitude?.toFixed(5)} (±${ci.gps_accuracy?.toFixed(0)}m)` : '  |  GPS: Not captured')
                  ),
                ci.status === 'missed' &&
                  React.createElement(
                    Text,
                    { style: styles.timelineDetail },
                    `Scheduled window expired. Escalation sent to admin.`
                  )
              )
            )
          )
      ),
      // Pre-Watch Safety Checklist (only if items exist)
      ...(checklistItems.length > 0 ? [
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'PRE-WATCH SAFETY CHECKLIST'),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, 'Status:'),
            React.createElement(Text, { style: styles.value }, watch.checklist_completed_at ? `Completed ${formatTs(watch.checklist_completed_at)}` : 'Not completed')
          ),
          ...checklistItems.map((item) => {
            const completion = checklistCompletions.find((c) => c.item_id === item.id)
            return React.createElement(
              View,
              { key: item.id, style: styles.timelineRow },
              React.createElement(View, {
                style: [styles.statusDot, { backgroundColor: completion ? '#16a34a' : '#dc2626' }],
              }),
              React.createElement(
                View,
                { style: styles.timelineContent },
                React.createElement(Text, { style: styles.timelineTime }, item.label),
                completion
                  ? React.createElement(Text, { style: styles.timelineDetail },
                      `Completed: ${formatTs(completion.completed_at)}` +
                      (item.requires_photo ? (completion.photo_url ? '  |  Photo: Attached' : '  |  Photo: Missing') : '')
                    )
                  : React.createElement(Text, { style: [styles.timelineDetail, { color: '#dc2626' }] }, 'Not completed')
              )
            )
          })
        )
      ] : []),
      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          Text,
          { style: styles.footerText },
          `DutyProof Fire Watch Compliance Report  |  Report ID: ${reportId}`
        ),
        React.createElement(
          Text,
          { style: styles.footerText },
          'Immutable records. Timestamps server-verified. Generated by DutyProof.'
        )
      )
    )
  )
}
