// E-commerce and Alumni Market types
export type ProductStatus = "draft" | "pending_approval" | "approved" | "rejected" | "sold" | "expired"
export type ProductCategory = "electronics" | "services" | "books" | "clothing" | "furniture" | "vehicles" | "other"

export interface Product {
  id: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  title: string
  description: string
  price: number
  currency: string
  category: ProductCategory
  images: string[]
  status: ProductStatus
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  views: number
  savedBy: string[]
  createdAt: string
  updatedAt: string
}

export interface ProductApproval {
  id: string
  productId: string
  reviewerId: string
  reviewerName: string
  status: "approved" | "rejected"
  notes?: string
  createdAt: string
}
