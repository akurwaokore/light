// Extended Event types for full events management system
export type EventStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled"
export type EventCategory =
  | "networking"
  | "professional"
  | "social"
  | "educational"
  | "reunion"
  | "fundraising"
  | "workshop"
  | "other"

export interface EventCreate {
  title: string
  description: string
  date: string
  time: string
  end_time?: string
  location: string
  is_virtual: boolean
  google_meet_link?: string
  category: EventCategory
  max_attendees?: number
  image_url?: string
  requires_registration: boolean
  registration_deadline?: string
  ticket_price?: number
  is_free: boolean
}

export interface EventFull {
  id: string
  title: string
  description: string
  date: string
  time: string
  end_time?: string
  location: string
  is_virtual: boolean
  google_meet_link?: string
  organizer_id: string
  organizer?: {
    id: string
    display_name: string
    email: string
    photo_url?: string
  }
  category: EventCategory
  max_attendees?: number
  registered_count: number
  image_url?: string
  status: EventStatus
  requires_approval: boolean
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  requires_registration: boolean
  registration_deadline?: string
  ticket_price?: number
  is_free: boolean
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  user?: {
    id: string
    display_name: string
    email: string
    photo_url?: string
  }
  status: "pending" | "registered" | "cancelled" | "attended"
  registered_at: string
  payment_status?: "pending" | "completed" | "refunded"
  payment_amount?: number
}
