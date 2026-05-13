import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Note: Bootstrap admins should be managed via the database user_roles table.
// Hardcoded lists are deprecated for production.
const ALLOWED_ADMIN_EMAILS: string[] = [] 

export async function checkAdminAccess(requiredPermission?: string) {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, status: 401 }

  // 1. Check if user has is_admin flag
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin && !ALLOWED_ADMIN_EMAILS.includes(user.email || "")) {
    return { authorized: false, status: 403 }
  }

  // 2. If no specific permission is required, being an admin is enough
  if (!requiredPermission) {
    return { authorized: true, supabase, user }
  }

  // 3. Check for Super Admin role (has all permissions)
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("roles(name, id)")
    .eq("user_id", user.id)

  const roles = userRoles?.map(ur => (ur.roles as any)?.name) || []
  
  if (roles.includes('super_admin')) {
    return { authorized: true, supabase, user }
  }

  // 4. Check for specific permission via roles
  const { data: permissions } = await supabase
    .from("user_roles")
    .select(`
      roles!inner (
        role_permissions!inner (
          permission_id
        )
      )
    `)
    .eq("user_id", user.id)

  const userPermissions = new Set<string>()
  permissions?.forEach((p: any) => {
    p.roles.role_permissions.forEach((rp: any) => {
      userPermissions.add(rp.permission_id)
    })
  })

  if (userPermissions.has(requiredPermission)) {
    return { authorized: true, supabase, user }
  }

  return { authorized: false, status: 403 }
}

export function unauthorizedResponse(status: number) {
  return new NextResponse(status === 401 ? "Unauthorized" : "Forbidden", { status })
}
