import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_roles")
  if (!authorized) return unauthorizedResponse(status!)

  const { data: roles, error } = await supabase!
    .from("roles")
    .select(`
      *,
      role_permissions (
        permission_id
      ),
      user_roles (
        user_id
      )
    `)
    .order("name", { ascending: true })

  if (error) return new NextResponse(error.message, { status: 500 })

  // Format data for frontend
  const formattedRoles = roles.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
    users: role.user_roles.length,
    permissions: role.role_permissions.map((rp: any) => rp.permission_id)
  }))

  return NextResponse.json(formattedRoles)
}

export async function POST(request: Request) {
    const { authorized, supabase, status } = await checkAdminAccess("manage_roles")
    if (!authorized) return unauthorizedResponse(status!)

    const body = await request.json()
    const { name, description, permissions } = body

    // 1. Create role
    const { data: role, error: roleError } = await supabase!
        .from("roles")
        .insert({ name, description })
        .select()
        .single()

    if (roleError) return new NextResponse(roleError.message, { status: 500 })

    // 2. Assign permissions
    if (permissions && permissions.length > 0) {
        const rolePermissions = permissions.map((pId: string) => ({
            role_id: role.id,
            permission_id: pId
        }))
        const { error: pError } = await supabase!.from("role_permissions").insert(rolePermissions)
        if (pError) return new NextResponse(pError.message, { status: 500 })
    }

    return NextResponse.json(role)
}
