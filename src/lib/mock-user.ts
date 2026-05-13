import type { UserProfile, Admin } from "@/types"

// Demo mode user for development
export const mockUser: UserProfile = {
  id: "demo-user-001",
  email: "demo@lightalumni.com",
  displayName: "John Mwangi",
  photoURL: "/professional-african-man-portrait.png",
  graduationYear: 2015,
  campus: "Light Academy Nairobi",
  jobTitle: "Software Engineer",
  company: "Tech Solutions Ltd",
  location: "Nairobi, Kenya",
  country: "Kenya",
  city: "Nairobi",
  bio: "Passionate about technology and giving back to my alma mater. Building the future one line of code at a time.",
  linkedIn: "https://linkedin.com/in/johnmwangi",
  phone: "+254 712 345 678",
  status: "working",
  membershipTier: "gold",
  membershipExpiry: "2025-12-31",
  createdAt: "2023-01-15T10:00:00Z",
  updatedAt: "2024-11-01T15:30:00Z",
}

export const mockAdmin: Admin = {
  id: "admin-001",
  userId: "demo-user-001",
  email: "demo@lightalumni.com",
  role: "super_admin",
  createdAt: "2023-01-15T10:00:00Z",
}

// Check if demo mode (always true for now)
export const isDemoMode = true

export function getCurrentUser(): UserProfile {
  return mockUser
}

export function isAdmin(): boolean {
  return isDemoMode ? true : false
}
