// AI Assistant types for front-facing support
export type AIMessageRole = "user" | "assistant" | "system"
export type AIConversationStatus = "active" | "resolved" | "escalated"

export interface AIMessage {
  id: string
  role: AIMessageRole
  content: string
  timestamp: string
}

export interface AIConversation {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  status: AIConversationStatus
  messages: AIMessage[]
  context: {
    currentPage?: string
    productId?: string
    propertyId?: string
    userQuery?: string
  }
  escalatedTo?: string // Staff member ID if escalated
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface AIKnowledgeBase {
  id: string
  category: string
  question: string
  answer: string
  tags: string[]
  relatedArticles?: string[]
  createdAt: string
  updatedAt: string
}
