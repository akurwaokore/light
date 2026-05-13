import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  if (!id || id === "undefined") {
    return new NextResponse("Invalid ID", { status: 400 })
  }

  const { authorized, supabase, status } = await checkAdminAccess("manage_content")
  if (!authorized) return unauthorizedResponse(status!)

  try {
    const body = await request.json()
    const { data: club, error } = await supabase!
      .from("clubs")
      .update({ 
        ...body, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return new NextResponse(error.message, { status: 500 })

    return NextResponse.json(club)
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  if (!id || id === "undefined") {
    return new NextResponse("Invalid ID", { status: 400 })
  }

  const { authorized, supabase, status } = await checkAdminAccess("manage_content")
  if (!authorized) return unauthorizedResponse(status!)

  const { error } = await supabase!
    .from("clubs")
    .delete()
    .eq("id", id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
