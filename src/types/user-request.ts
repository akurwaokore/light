// User request and support types
export type RequestStatus = "open" | "in_progress" | "waiting_response" | "resolved" | "closed"
export type RequestPriority = "low" | "medium" | "high" | "urgent"
export type RequestCategory = "technical" | "account" | "billing" | "product" | "general" | "other"
export type UserRole = "admin" | "staff" | "user" // Declared UserRole type

export interface UserRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  category: RequestCategory
  priority: RequestPriority
  status: RequestStatus
  subject: string
  description: string
  attachments?: string[]
  assignedTo?: string
  assignedToName?: string
  responses: RequestResponse[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface RequestResponse {
  id: string
  requestId: string
  responderId: string
  responderName: string
  responderRole: UserRole
  message: string
  attachments?: string[]
  internal: boolean // Internal notes only visible to staff
  createdAt: string
}
