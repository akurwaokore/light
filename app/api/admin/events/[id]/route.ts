import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id || id === "undefined") {
    return new NextResponse("Invalid ID", { status: 400 })
  }

  const { authorized, supabase, status } = await checkAdminAccess("manage_events")
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()

  const { data, error } = await supabase!
    .from("events")
    .update(body)
    .eq("id", id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id || id === "undefined") {
    return new NextResponse("Invalid ID", { status: 400 })
  }

  const { authorized, supabase, status } = await checkAdminAccess("manage_events")
  if (!authorized) return unauthorizedResponse(status!)

  const { error } = await supabase!
    .from("events")
    .delete()
    .eq("id", id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
