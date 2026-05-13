export interface Notification {
  id: string
  user_id: string
  type:
    | "product_approved"
    | "product_rejected"
    | "product_sold"
    | "product_purchased"
    | "service_approved"
    | "service_rejected"
    | "service_purchased"
    | "property_approved"
    | "property_rejected"
    | "property_sold"
    | "payout_completed"
    | "payout_failed"
    | "request_response"
    | "request_resolved"
    | "event_reminder"
    | "event_cancelled"
    | "event_updated"
    | "new_submission"
    | "admin_action_required"
    | "meet_invitation"
    | "meet_reminder"
    | "meet_cancelled"
    | "general"
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
  read: boolean
  created_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  date: string
  time: string
  location?: string
  is_virtual: boolean
  google_meet_link?: string
  organizer_id: string
  organizer_name: string
  category?: string
  max_attendees?: number
  registered_count: number
  image_url?: string
  status: "draft" | "upcoming" | "ongoing" | "completed" | "cancelled"
  requires_approval: boolean
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description?: string
  creator_id: string
  category?: string
  privacy: "public" | "private"
  requires_approval: boolean
  member_count: number
  max_members?: number
  image_url?: string
  status: "pending_approval" | "active" | "inactive" | "suspended"
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface GroupMeeting {
  id: string
  group_id: string
  title: string
  description?: string
  scheduled_at: string
  duration_minutes: number
  google_meet_link?: string
  created_by: string
  status: "scheduled" | "ongoing" | "completed" | "cancelled"
  created_at: string
}
