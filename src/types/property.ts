// Property management types
export type PropertyStatus = "draft" | "pending_approval" | "approved" | "rejected" | "rented" | "sold" | "expired"
export type PropertyType = "apartment" | "house" | "office" | "land" | "commercial" | "other"
export type ListingType = "sale" | "rent"

export interface Property {
  id: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  title: string
  description: string
  type: PropertyType
  listingType: ListingType
  price: number
  currency: string
  location: string
  city: string
  country: string
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  amenities: string[]
  images: string[]
  status: PropertyStatus
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  views: number
  savedBy: string[]
  createdAt: string
  updatedAt: string
}

export interface PropertyApproval {
  id: string
  propertyId: string
  reviewerId: string
  reviewerName: string
  status: "approved" | "rejected"
  notes?: string
  createdAt: string
}
