import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import type { Watch, Facility, CheckIn, Alert } from '@/types/database'

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
  adminEmail: string
}

interface WatchWithFacility extends Watch {
  facilities: Facility
}

function formatTs(ts: string | null, tz = 'America/New_York'): string {
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

export function WatchReport({ watch, checkIns, alerts, adminEmail }: ReportData) {
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
        React.createElement(Text, { style: styles.sectionTitle }, 'FACILITY INFORMATION'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Facility Name:'),
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
          React.createElement(Text, { style: styles.label }, 'Assigned Personnel:'),
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
