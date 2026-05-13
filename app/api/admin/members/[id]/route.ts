import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_users")
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = await params

  console.log(`[Admin API] Fetching member details for ID: ${id}`)

  const { data: member, error } = await supabase!
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error(`[Admin API] Error fetching member ${id}:`, error)
    return new NextResponse(error.message || "Member not found", { status: 404 })
  }

  return NextResponse.json(member)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_users")
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()
  const { id } = await params

  const { data: member, error } = await supabase!
    .from("profiles")
    .update({ 
      ...body, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(member)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_users")
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = await params

  // Note: This will delete the profile. auth.users deletion usually requires service_role
  const { error } = await supabase!
    .from("profiles")
    .delete()
    .eq("id", id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
