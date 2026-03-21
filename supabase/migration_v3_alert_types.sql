-- migration_v3_alert_types.sql
--
-- Expand the alert_type constraint on the alerts table to include all
-- alert types actually used across the codebase:
--   - watcher_offline / watcher_online  (cron & offline-sync routes)
--   - offline_reconciled                (replaces misuse of 'sms_sent' for offline reconciliation audits)
--   - late_recovery                     (replaces misuse of 'sms_sent' for late check-in recovery audits)
--
-- Run AFTER schema.sql and migration_v2_watch_enhancements.sql.

-- Drop the old constraint
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alert_type_enum;

-- Add the expanded constraint
ALTER TABLE alerts ADD CONSTRAINT alert_type_enum CHECK (
  alert_type IN (
    'missed_checkin',
    'sms_sent',
    'sms_delivered',
    'sms_failed',
    'watch_started',
    'watch_ended',
    'escalation_acknowledged',
    'watcher_offline',
    'watcher_online',
    'offline_reconciled',
    'late_recovery'
  )
);
