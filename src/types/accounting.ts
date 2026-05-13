// Accounting and payout system types
export type PayoutStatus = "pending" | "processing" | "completed" | "failed" | "cancelled"
export type TransactionType = "sale" | "membership" | "donation" | "refund" | "commission"
export type PaymentMethod = "mpesa" | "bank_transfer" | "card" | "paypal"

export interface Transaction {
  id: string
  userId: string
  userName: string
  type: TransactionType
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  status: "pending" | "completed" | "failed" | "refunded"
  description: string
  referenceId?: string
  productId?: string
  propertyId?: string
  createdAt: string
  completedAt?: string
}

export interface Payout {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  currency: string
  status: PayoutStatus
  paymentMethod: PaymentMethod
  accountDetails: {
    accountNumber?: string
    bankName?: string
    mpesaNumber?: string
    paypalEmail?: string
  }
  transactions: string[] // Transaction IDs included in this payout
  requestedAt: string
  processedAt?: string
  completedAt?: string
  failureReason?: string
  processedBy?: string
}

export interface Commission {
  id: string
  transactionId: string
  sellerId: string
  amount: number
  percentage: number
  status: "pending" | "paid"
  createdAt: string
  paidAt?: string
}

export interface AccountingReport {
  period: {
    start: string
    end: string
  }
  revenue: {
    total: number
    byType: Record<TransactionType, number>
  }
  payouts: {
    total: number
    pending: number
    completed: number
  }
  commissions: {
    total: number
    pending: number
    paid: number
  }
  activeUsers: number
  transactions: number
}
