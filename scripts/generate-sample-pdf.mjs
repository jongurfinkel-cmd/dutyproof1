import React from 'react'
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
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

// ─── Map tile helpers (from src/lib/pdf.ts) ───
function latLonToTile(lat, lon, zoom) {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lon + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n)
  return { x, y }
}

function getMapTileUrls(lat, lon) {
  const zoom = 16
  const { x, y } = latLonToTile(lat, lon, zoom)
  return [
    `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
    `https://tile.openstreetmap.org/${zoom}/${x + 1}/${y}.png`,
    `https://tile.openstreetmap.org/${zoom}/${x}/${y + 1}.png`,
    `https://tile.openstreetmap.org/${zoom}/${x + 1}/${y + 1}.png`,
  ]
}

// All times are America/New_York (EDT, UTC-4) on March 14, 2025 (after DST spring forward)
// 8:00 AM EDT = 12:00 UTC, 8:30 AM EDT = 12:30 UTC, etc.
const TZ = 'America/New_York'
const checkIns = [
  { id: '1', scheduled_time: '2025-03-14T12:00:00Z', completed_at: '2025-03-14T12:01:23Z', server_received_at: '2025-03-14T12:01:24Z', status: 'completed', latitude: 40.7580, longitude: -73.8855, gps_accuracy: 8 },
  { id: '2', scheduled_time: '2025-03-14T12:30:00Z', completed_at: '2025-03-14T12:30:55Z', server_received_at: '2025-03-14T12:30:56Z', status: 'completed', latitude: 40.7581, longitude: -73.8854, gps_accuracy: 11 },
  { id: '3', scheduled_time: '2025-03-14T13:00:00Z', completed_at: null, server_received_at: null, status: 'missed', latitude: null, longitude: null, gps_accuracy: null, escalation_sent_at: '2025-03-14T13:02:00Z', ack_at: '2025-03-14T13:05:30Z', ack_latitude: 40.7583, ack_longitude: -73.8852, ack_gps_accuracy: 15 },
  { id: '4', scheduled_time: '2025-03-14T13:30:00Z', completed_at: '2025-03-14T13:31:08Z', server_received_at: '2025-03-14T13:31:09Z', status: 'completed', latitude: 40.7579, longitude: -73.8856, gps_accuracy: 9 },
  { id: '5', scheduled_time: '2025-03-14T14:00:00Z', completed_at: '2025-03-14T14:00:47Z', server_received_at: '2025-03-14T14:00:48Z', status: 'completed', latitude: 40.7580, longitude: -73.8855, gps_accuracy: 7 },
  { id: '6', scheduled_time: '2025-03-14T14:30:00Z', completed_at: '2025-03-14T14:30:32Z', server_received_at: '2025-03-14T14:30:33Z', status: 'completed', latitude: 40.7582, longitude: -73.8853, gps_accuracy: 10 },
  { id: '7', scheduled_time: '2025-03-14T15:00:00Z', completed_at: '2025-03-14T15:01:12Z', server_received_at: '2025-03-14T15:01:13Z', status: 'completed', latitude: 40.7580, longitude: -73.8855, gps_accuracy: 8 },
  { id: '8', scheduled_time: '2025-03-14T15:30:00Z', completed_at: '2025-03-14T15:30:58Z', server_received_at: '2025-03-14T15:30:59Z', status: 'completed', latitude: 40.7578, longitude: -73.8857, gps_accuracy: 12 },
]

function fmt(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
}

const completedCIs = checkIns.filter(c => c.status === 'completed')
const missedCIs = checkIns.filter(c => c.status === 'missed')
const total = completedCIs.length + missedCIs.length
const pct = Math.round((completedCIs.length / total) * 100)
const acknowledgedCount = missedCIs.filter(c => c.ack_at).length

// GPS averages for check-in coverage map
const gpsCheckins = completedCIs.filter(c => c.latitude != null)
const avgLat = gpsCheckins.reduce((s, c) => s + c.latitude, 0) / gpsCheckins.length
const avgLon = gpsCheckins.reduce((s, c) => s + c.longitude, 0) / gpsCheckins.length
const avgAccuracy = gpsCheckins.reduce((s, c) => s + c.gps_accuracy, 0) / gpsCheckins.length
const checkinTiles = getMapTileUrls(avgLat, avgLon)

// GPS averages for supervisor acknowledgment map
const ackCheckins = missedCIs.filter(c => c.ack_at && c.ack_latitude != null)
const ackAvgLat = ackCheckins.reduce((s, c) => s + c.ack_latitude, 0) / ackCheckins.length
const ackAvgLon = ackCheckins.reduce((s, c) => s + c.ack_longitude, 0) / ackCheckins.length
const ackAvgAccuracy = ackCheckins.reduce((s, c) => s + c.ack_gps_accuracy, 0) / ackCheckins.length
const ackTiles = getMapTileUrls(ackAvgLat, ackAvgLon)

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
        `Report ID: A3F9C12B  |  Generated: ${fmt('2025-03-14T16:00:00Z')}  |  Immutable records — tamper-evident`
      )
    ),

    // Job Site Info
    React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'JOB SITE INFORMATION'),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Job Site / Company:'),
        React.createElement(Text, { style: styles.value }, 'Ace Mechanical — LaGuardia Terminal B Expansion')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Address:'),
        React.createElement(Text, { style: styles.value }, 'LaGuardia Airport, Flushing, NY 11371')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Location / Area:'),
        React.createElement(Text, { style: styles.value }, 'Building D — Bay 4, Level 2 Steel Deck')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Timezone:'),
        React.createElement(Text, { style: styles.value }, TZ)
      )
    ),

    // Watch Summary
    React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'WATCH SUMMARY'),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Reason for Watch:'),
        React.createElement(Text, { style: styles.value }, 'Post-weld watch — structural steel pipe welding, Bay 4')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Fire Watcher:'),
        React.createElement(Text, { style: styles.value }, 'D. Kim  |  +1 (718) 555-0194')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Supervisor (Escalation):'),
        React.createElement(Text, { style: styles.value }, 'T. Okafor — Foreman  |  +1 (718) 555-0177')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Check-in Interval:'),
        React.createElement(Text, { style: styles.value }, 'Every 30 minutes  (NFPA 51B §6.4 / OSHA 29 CFR §1910.252)')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Watch Started:'),
        React.createElement(Text, { style: styles.value }, fmt('2025-03-14T12:00:00Z'))
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Watch Ended:'),
        React.createElement(Text, { style: styles.value }, fmt('2025-03-14T15:45:00Z'))
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Duration:'),
        React.createElement(Text, { style: styles.value }, '3h 45m')
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.label }, 'Closed By:'),
        React.createElement(Text, { style: styles.value }, 'jon@acemechanical.com')
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
          React.createElement(Text, { style: [styles.scoreNumber, { color: '#16a34a' }] }, String(completedCIs.length)),
          React.createElement(Text, { style: styles.scoreLabel }, 'CHECK-INS COMPLETED')
        ),
        React.createElement(View, { style: styles.scoreCard },
          React.createElement(Text, { style: [styles.scoreNumber, { color: '#dc2626' }] }, String(missedCIs.length)),
          React.createElement(Text, { style: styles.scoreLabel }, 'CHECK-INS MISSED')
        ),
        React.createElement(View, { style: styles.scoreCard },
          React.createElement(Text, { style: [styles.scoreNumber, { color: '#1e3a5f' }] }, '1'),
          React.createElement(Text, { style: styles.scoreLabel }, 'ALERTS SENT')
        ),
        React.createElement(View, { style: styles.scoreCard },
          React.createElement(Text, { style: [styles.scoreNumber, { color: '#d97706' }] }, String(acknowledgedCount)),
          React.createElement(Text, { style: styles.scoreLabel }, 'ACKNOWLEDGED')
        )
      )
    ),

    // GPS Coverage Map
    React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'GPS COVERAGE MAP'),
      React.createElement(
        View,
        { style: { flexDirection: 'row', flexWrap: 'wrap', width: 300, height: 300, alignSelf: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 4, overflow: 'hidden' } },
        ...checkinTiles.map((url, i) =>
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

    // Supervisor Acknowledgment Map
    React.createElement(View, { style: styles.section },
      React.createElement(Text, { style: styles.sectionTitle }, 'SUPERVISOR ACKNOWLEDGMENT MAP'),
      React.createElement(
        View,
        { style: { flexDirection: 'row', flexWrap: 'wrap', width: 300, height: 300, alignSelf: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 4, overflow: 'hidden' } },
        ...ackTiles.map((url, i) =>
          React.createElement(Image, { key: String(i), src: url, style: { width: 150, height: 150 } })
        )
      ),
      React.createElement(
        Text,
        { style: { fontSize: 8, color: '#666', textAlign: 'center', marginTop: 6 } },
        `Center: ${ackAvgLat.toFixed(5)}, ${ackAvgLon.toFixed(5)}  |  ${ackCheckins.length} GPS-verified acknowledgment(s)  |  Avg accuracy: ±${ackAvgAccuracy.toFixed(0)}m`
      ),
      React.createElement(
        Text,
        { style: { fontSize: 7, color: '#999', textAlign: 'center', marginTop: 2 } },
        'Map data © OpenStreetMap contributors'
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
              : React.createElement(View, null,
                  React.createElement(Text, { style: styles.timelineDetail },
                    'Scheduled window expired. Escalation sent to supervisor.'
                  ),
                  ci.ack_at
                    ? React.createElement(Text, { style: [styles.timelineDetail, { color: '#d97706' }] },
                        `Supervisor acknowledged: ${fmt(ci.ack_at)}  |  GPS: ${ci.ack_latitude?.toFixed(5)}, ${ci.ack_longitude?.toFixed(5)} (±${ci.ack_gps_accuracy?.toFixed(0)}m)`
                      )
                    : null
                )
          )
        )
      )
    ),

    // Footer
    React.createElement(View, { style: styles.footer, fixed: true },
      React.createElement(Text, { style: styles.footerText }, 'DutyProof Fire Watch Compliance Report  |  Report ID: A3F9C12B  |  SAMPLE REPORT'),
      React.createElement(Text, { style: styles.footerText }, 'Immutable records. Timestamps server-verified. Generated by DutyProof.')
    )
  )
)

const buf = await renderToBuffer(doc)
const out = join(__dirname, '../public/sample-report.pdf')
writeFileSync(out, buf)
console.log('Sample PDF written to', out)
