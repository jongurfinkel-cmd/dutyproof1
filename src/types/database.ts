export interface Profile {
  id: string
  created_at: string
  email: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | null
  trial_ends_at: string | null
  current_period_end: string | null
  is_admin: boolean
}

export interface Facility {
  id: string
  created_at: string
  name: string
  address: string | null
  timezone: string
  owner_id: string
}

export interface Watch {
  id: string
  created_at: string
  facility_id: string
  status: 'active' | 'completed'
  check_interval_min: number
  start_time: string
  assigned_name: string
  assigned_phone: string
  reason: string | null
  location: string | null
  ended_by: string | null
  ended_at: string | null
  owner_id: string
  checklist_token: string | null
  checklist_completed_at: string | null
  escalation_phone: string | null
  escalation_delay_min: number
  planned_end_time: string | null
}

export interface WatchChecklistItem {
  id: string
  created_at: string
  watch_id: string
  label: string
  requires_photo: boolean
  sort_order: number
}

export interface ChecklistCompletion {
  id: string
  created_at: string
  watch_id: string
  item_id: string
  completed_at: string
  photo_url: string | null
  checklist_token: string
}

export interface WatchWithFacility extends Watch {
  facilities: Facility
}

export interface CheckIn {
  id: string
  created_at: string
  watch_id: string
  scheduled_time: string
  status: 'pending' | 'completed' | 'missed' | 'cancelled'
  completed_at: string | null
  server_received_at: string | null
  latitude: number | null
  longitude: number | null
  gps_accuracy: number | null
  token: string
  token_expires_at: string
  assigned_name: string
  escalation_sent_at: string | null
}

export interface Alert {
  id: string
  created_at: string
  watch_id: string
  check_in_id: string | null
  alert_type: 'missed_checkin' | 'sms_delivered' | 'watch_started' | 'watch_ended' | 'sms_failed' | 'sms_sent'
  recipient_phone: string | null
  recipient_name: string | null
  message: string | null
  delivery_status: 'sent' | 'delivered' | 'failed' | null
  twilio_sid: string | null
}
