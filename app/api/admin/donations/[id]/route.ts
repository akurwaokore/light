import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()
  const { id } = params

  const { data: campaign, error } = await supabase!
    .from("donation_campaigns")
    .update({ 
      ...body, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(campaign)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = params

  const { error } = await supabase!
    .from("donation_campaigns")
    .delete()
    .eq("id", id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
