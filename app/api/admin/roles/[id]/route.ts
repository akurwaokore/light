import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_roles")
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()
  const { name, description, permissions } = body
  const { id: roleId } = await params

  // 1. Update role details
  const { error: roleError } = await supabase!
    .from("roles")
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq("id", roleId)

  if (roleError) return new NextResponse(roleError.message, { status: 500 })

  // 2. Update permissions if provided
  if (permissions) {
    // Delete existing permissions
    const { error: deleteError } = await supabase!
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId)

    if (deleteError) return new NextResponse(deleteError.message, { status: 500 })

    // Insert new permissions
    if (permissions.length > 0) {
      const rolePermissions = permissions.map((pId: string) => ({
        role_id: roleId,
        permission_id: pId
      }))
      const { error: insertError } = await supabase!
        .from("role_permissions")
        .insert(rolePermissions)

      if (insertError) return new NextResponse(insertError.message, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_roles")
  if (!authorized) return unauthorizedResponse(status!)

  const { id: roleId } = await params

  // Don't allow deleting the super_admin role if possible
  const { data: role } = await supabase!
    .from("roles")
    .select("name")
    .eq("id", roleId)
    .single()

  if (role?.name === "super_admin") {
    return new NextResponse("Cannot delete super_admin role", { status: 400 })
  }

  const { error } = await supabase!
    .from("roles")
    .delete()
    .eq("id", roleId)

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json({ success: true })
}
