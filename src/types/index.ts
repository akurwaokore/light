export interface UserProfile {
  id: string
  email: string
  displayName: string
  photoURL?: string
  graduationYear?: number
  campus?: string
  jobTitle?: string
  company?: string
  location?: string
  country?: string
  city?: string
  bio?: string
  linkedIn?: string
  phone?: string
  status?: "studying" | "working" | "retired" | "other"
  membershipTier?: "free" | "silver" | "gold" | "platinum"
  membershipExpiry?: string
  role?: "user" | "secretary" | "editor" | "admin" | "super_admin"
  createdAt: string
  updatedAt: string
}

export interface Admin {
  id: string
  userId: string
  email: string
  role: "admin" | "super_admin"
  createdAt: string
}

export interface Post {
  id: string
  authorId: string
  authorName: string
  authorPhotoURL?: string
  content: string
  imageURL?: string
  likes: string[]
  commentsCount: number
  createdAt: string
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorPhotoURL?: string
  content: string
  createdAt: string
}

export interface Club {
  id: string
  name: string
  description: string
  icon: string
  memberCount: number
  category: "professional" | "interest" | "regional" | "batch"
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  isVirtual: boolean
  registeredCount: number
  imageURL?: string
}

export interface MarketplaceListing {
  id: string
  sellerId: string
  sellerName: string
  title: string
  description: string
  price: number
  category: string
  imageURL?: string
  status: "active" | "sold" | "expired"
  createdAt: string
}

export interface Job {
  id: string
  posterId: string
  posterName: string
  company: string
  title: string
  description: string
  location: string
  type: "full-time" | "part-time" | "contract" | "internship"
  salary?: string
  createdAt: string
}

export interface Campaign {
  id: string
  title: string
  description: string
  goal: number
  raised: number
  endDate: string
  imageURL?: string
}

export interface Perk {
  id: string
  business: string
  owner: string
  description: string
  discount: string
  category: string
  logoURL?: string
  website?: string
}

export * from "./roles"
export * from "./marketplace"
export * from "./property"
export * from "./accounting"
export * from "./user-request"
export * from "./ai-assistant"
export * from "./notification"
export * from "./jobs-cv"
export * from "./events"
