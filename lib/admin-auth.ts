import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Note: Bootstrap admins should be managed via the database user_roles table.
// Hardcoded lists are deprecated for production.
const ALLOWED_ADMIN_EMAILS: string[] = [] 

export async function checkAdminAccess(requiredPermission?: string) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, status: 401 }

  // Adminness comes from ANY of: profiles.is_admin, an admin/super_admin role,
  // or the bootstrap email allowlist. This mirrors the admin layout so an admin
  // is never let into the panel but blocked by the APIs.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id)
  const roles = (userRoles || []).map((ur: any) => (Array.isArray(ur.roles) ? ur.roles[0]?.name : ur.roles?.name)).filter(Boolean)

  const isSuperAdmin = roles.includes("super_admin")
  const isAdmin =
    profile?.is_admin === true ||
    isSuperAdmin ||
    roles.includes("admin") ||
    ALLOWED_ADMIN_EMAILS.includes(user.email || "")

  if (!isAdmin) {
    return { authorized: false, status: 403 }
  }

  // Full admins (is_admin / admin / super_admin) have every permission.
  if (!requiredPermission || isSuperAdmin || profile?.is_admin === true || roles.includes("admin")) {
    return { authorized: true, supabase, user }
  }

  // Otherwise check the specific permission via role_permissions.
  const { data: permissions } = await supabase
    .from("user_roles")
    .select(`roles!inner ( role_permissions!inner ( permission_id ) )`)
    .eq("user_id", user.id)

  const userPermissions = new Set<string>()
  permissions?.forEach((p: any) => {
    const r = Array.isArray(p.roles) ? p.roles : [p.roles]
    r.forEach((role: any) => (role?.role_permissions || []).forEach((rp: any) => userPermissions.add(rp.permission_id)))
  })

  if (userPermissions.has(requiredPermission)) {
    return { authorized: true, supabase, user }
  }
  return { authorized: false, status: 403 }
}

export function unauthorizedResponse(status: number) {
  return new NextResponse(status === 401 ? "Unauthorized" : "Forbidden", { status })
}
