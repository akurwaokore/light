import type { NextRequest } from "next/server"
import { unauthorized } from "./security"

// Mock user for demonstration (replace with real Supabase auth)
export function getMockUser(request: NextRequest) {
  // In production: verify JWT token from Supabase
  // For now, return null to enforce no auth (presentation mode)
  return null
}

export async function protectRoute(request: NextRequest, requireAdmin = false) {
  // For presentation mode, admin routes should still be protected
  if (requireAdmin) {
    return unauthorized("Admin authentication required")
  }

  return null
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin")
}
