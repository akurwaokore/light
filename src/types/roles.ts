// Role-based access control types
export type UserRole = "user" | "secretary" | "editor" | "admin" | "super_admin"

export interface RolePermissions {
  canCreateContent: boolean
  canEditContent: boolean
  canDeleteContent: boolean
  canApproveProducts: boolean
  canApproveProperties: boolean
  canManageUsers: boolean
  canManageAccounting: boolean
  canCreateRoles: boolean
  canRespondToRequests: boolean
  canAccessAnalytics: boolean
  canManagePayouts: boolean
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  user: {
    canCreateContent: true,
    canEditContent: false,
    canDeleteContent: false,
    canApproveProducts: false,
    canApproveProperties: false,
    canManageUsers: false,
    canManageAccounting: false,
    canCreateRoles: false,
    canRespondToRequests: false,
    canAccessAnalytics: false,
    canManagePayouts: false,
  },
  secretary: {
    canCreateContent: true,
    canEditContent: true,
    canDeleteContent: false,
    canApproveProducts: false,
    canApproveProperties: false,
    canManageUsers: false,
    canManageAccounting: false,
    canCreateRoles: false,
    canRespondToRequests: true,
    canAccessAnalytics: false,
    canManagePayouts: false,
  },
  editor: {
    canCreateContent: true,
    canEditContent: true,
    canDeleteContent: true,
    canApproveProducts: false,
    canApproveProperties: false,
    canManageUsers: false,
    canManageAccounting: false,
    canCreateRoles: false,
    canRespondToRequests: true,
    canAccessAnalytics: true,
    canManagePayouts: false,
  },
  admin: {
    canCreateContent: true,
    canEditContent: true,
    canDeleteContent: true,
    canApproveProducts: true,
    canApproveProperties: true,
    canManageUsers: true,
    canManageAccounting: true,
    canCreateRoles: true,
    canRespondToRequests: true,
    canAccessAnalytics: true,
    canManagePayouts: true,
  },
  super_admin: {
    canCreateContent: true,
    canEditContent: true,
    canDeleteContent: true,
    canApproveProducts: true,
    canApproveProperties: true,
    canManageUsers: true,
    canManageAccounting: true,
    canCreateRoles: true,
    canRespondToRequests: true,
    canAccessAnalytics: true,
    canManagePayouts: true,
  },
}
