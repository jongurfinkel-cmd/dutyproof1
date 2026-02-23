import React from 'react'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 40, color: '#1a1a1a' },
  header: { marginBottom: 24, borderBottomWidth: 3, borderBottomColor: '#1e3a5f', paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#1e3a5f', letterSpacing: 2 },
  headerSubtitle: { fontSize: 13, color: '#e85c0d', fontFamily: 'Helvetica-Bold', marginTop: 4 },
  headerMeta: { fontSize: 8, color: '#666', marginTop: 6 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1e3a5f', backgroundColor: '#f0f4f8', padding: '6 8', marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#e85c0d' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, fontFamily: 'Helvetica-Bold', color: '#444' },
  value: { flex: 1, color: '#1a1a1a' },
  scoreBox: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  scoreCard: { flex: 1, backgroundColor: '#f8f9fa', padding: 10, borderRadius: 4, alignItems: 'center' },
  scoreNumber: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
  scoreLabel: { fontSize: 8, color: '#666', marginTop: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2, marginRight: 8 },
  timelineContent: { flex: 1 },
  timelineTime: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  timelineDetail: { fontSize: 8, color: '#666', marginTop: 2 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#888' },
  sampleBanner: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b', padding: '8 12', marginBottom: 20, borderRadius: 4 },
  sampleBannerText: { fontSize: 8, color: '#92400e', fontFamily: 'Helvetica-Bold', textAlign: 'center' },
})

const checkIns = [
  { id: '1', scheduled_time: '2025-03-14T08:00:00Z', completed_at: '2025-03-14T08:01:23Z', server_received_at: '2025-03-14T08:01:24Z', status: 'completed', latitude: 34.0521, longitude: -118.2437, gps_accuracy: 8 },
  { id: '2', scheduled_time: '2025-03-14T08:30:00Z', completed_at: '2025-03-14T08:30:55Z', server_received_at: '2025-03-14T08:30:56Z', status: 'completed', latitude: 34.0522, longitude: -118.2436, gps_accuracy: 11 },
  { id: '3', scheduled_time: '2025-03-14T09:00:00Z', completed_at: null, server_received_at: null, status: 'missed', latitude: null, longitude: null, gps_accuracy: null },
  { id: '4', scheduled_time: '2025-03-14T09:30:00Z', completed_at: '2025-03-14T09:31:08Z', server_received_at: '2025-03-14T09:31:09Z', status: 'completed', latitude: 34.0520, longitude: -118.2438, gps_accuracy: 9 },
  { id: '5', scheduled_time: '2025-03-14T10:00:00Z', completed_at: '2025-03-14T10:00:47Z', server_received_at: '2025-03-14T10:00:48Z', status: 'completed', latitude: 34.0521, longitude: -118.2437, gps_accuracy: 7 },
  { id: '6', scheduled_time: '2025-03-14T10:30:00Z', completed_at: '2025-03-14T10:30:32Z', server_received_at: '2025-03-14T10:30:33Z', status: 'completed', latitude: 34.0523, longitude: -118.2436, gps_accuracy: 10 },
  { id: '7', scheduled_time: '2025-03-14T11:00:00Z', completed_at: '2025-03-14T11:01:12Z', server_received_at: '2025-03-14T11:01:13Z', status: 'completed', latitude: 34.0521, longitude: -118.2437, gps_accuracy: 8 },
  { id: '8', scheduled_time: '2025-03-14T11:30:00Z', completed_at: '2025-03-14T11:30:58Z', server_received_at: '2025-03-14T11:30:59Z', status: 'completed', latitude: 34.0522, longitude: -118.2437, gps_accuracy: 12 },
]

function fmt(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
}

const completed = checkIns.filter(c => c.status === 'completed').length
const missed = checkIns.filter(c => c.status === 'missed').length
const total = completed + missed
const pct = Math.round((completed / total) * 100)

const doc = React.createElement(
  Document,
  null,
  React.createElement(
    Page,
    { size: 'LETTER', style: styles.page },

    // SAMPLE BANNER
    React.createElement(View, { style: styles.sampleBanner },
      React.createElement(Text, { style: styles.sampleBannerText },
        'SAMPLE REPORT — All names, addresses, and personnel are fictional. For illustration purposes only.'
      )
    ),

    // Header
    React.createElement(View, { style: styles.header },
      React.createElement(Text, { style: styles.headerTitle }, 'DUTYPROOF'),
      React.createElement(Text, { style: styles.headerSubtitle }, 'Fire Watch Compliance Report'),
      React.createElement(Text, { style: styles.headerMeta },
        'Report ID: A3F9C12B  |  Generated: Mar 14, 2025 12:15 PM  |  Immutable records — tamper-evident'
      )
    ),

    // Facility Info
    React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'FACILITY INFORMATION'),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Facility Name:'),
        React.createElement(Text, { style: styles.value }, 'Sunrise Gardens Assisted Living')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Address:'),
        React.createElement(Text, { style: styles.value }, '4820 Maplewood Drive, Springfield, IL 62704')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Location / Area:'),
        React.createElement(Text, { style: styles.value }, 'East Wing — 2nd Floor')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Timezone:'),
        React.createElement(Text, { style: styles.value }, 'America/Chicago')
      )
    ),

    // Watch Summary
    React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'WATCH SUMMARY'),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Reason for Watch:'),
        React.createElement(Text, { style: styles.value }, 'Fire alarm panel offline — scheduled maintenance')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Assigned Personnel:'),
        React.createElement(Text, { style: styles.value }, 'R. Thompson  |  +1 (555) 000-0000')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Check-in Interval:'),
        React.createElement(Text, { style: styles.value }, 'Every 30 minutes')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Watch Started:'),
        React.createElement(Text, { style: styles.value }, 'Mar 14, 2025  8:00:00 AM EST')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Watch Ended:'),
        React.createElement(Text, { style: styles.value }, 'Mar 14, 2025 11:45:00 AM EST')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Duration:'),
        React.createElement(Text, { style: styles.value }, '3h 45m')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Closed By:'),
        React.createElement(Text, { style: styles.value }, 'admin@sunrisegardens.com')
      )
    ),

    // Compliance Score
    React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'COMPLIANCE SUMMARY'),
      React.createElement(View, { style: styles.scoreBox },
        React.createElement(View, { style: styles.scoreCard },
          React.createElement(Text, { style: [styles.scoreNumber, { color: '#16a34a' }] }, `${pct}%`),
          React.createElement(Text, { style: styles.scoreLabel }, 'COMPLIANCE RATE')
        ),
        React.createElement(View, { style: styles.scoreCard },
          React.createElement(Text, { style: [styles.scoreNumber, { color: '#16a34a' }] }, String(completed)),
          React.createElement(Text, { style: styles.scoreLabel }, 'CHECK-INS COMPLETED')
        ),
        React.createElement(View, { style: styles.scoreCard },
          React.createElement(Text, { style: [styles.scoreNumber, { color: '#dc2626' }] }, String(missed)),
          React.createElement(Text, { style: styles.scoreLabel }, 'CHECK-INS MISSED')
        ),
        React.createElement(View, { style: styles.scoreCard },
          React.createElement(Text, { style: [styles.scoreNumber, { color: '#1e3a5f' }] }, '1'),
          React.createElement(Text, { style: styles.scoreLabel }, 'ALERTS SENT')
        )
      )
    ),

    // Check-In Timeline
    React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'CHECK-IN TIMELINE'),
      ...checkIns.map(ci =>
        React.createElement(View, { key: ci.id, style: styles.timelineRow },
          React.createElement(View, {
            style: [styles.statusDot, { backgroundColor: ci.status === 'completed' ? '#16a34a' : '#dc2626' }]
          }),
          React.createElement(View, { style: styles.timelineContent },
            React.createElement(Text, { style: styles.timelineTime },
              `${fmt(ci.scheduled_time)}  —  ${ci.status.toUpperCase()}`
            ),
            ci.status === 'completed' && ci.completed_at
              ? React.createElement(Text, { style: styles.timelineDetail },
                  `Device time: ${fmt(ci.completed_at)}  |  Server received: ${fmt(ci.server_received_at)}  |  GPS: ${ci.latitude?.toFixed(4)}, ${ci.longitude?.toFixed(4)} (±${ci.gps_accuracy}m)`
                )
              : React.createElement(Text, { style: styles.timelineDetail },
                  'Scheduled window expired. Escalation SMS sent to supervisor within 60 seconds.'
                )
          )
        )
      )
    ),

    // Footer
    React.createElement(View, { style: styles.footer, fixed: true },
      React.createElement(Text, { style: styles.footerText }, 'DutyProof Fire Watch Compliance Report  |  Report ID: A3F9C12B  |  SAMPLE'),
      React.createElement(Text, { style: styles.footerText }, 'Immutable records. Timestamps server-verified. Generated by DutyProof.')
    )
  )
)

const buf = await renderToBuffer(doc)
const out = join(__dirname, '../public/sample-report.pdf')
writeFileSync(out, buf)
console.log('Sample PDF written to', out)
