import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

// Admin already verified in code; use the service-role client for the write so
// donation_campaigns' role-based RLS doesn't silently block real admins.
function db(fallback: any) {
  try {
    return createAdminClient()
  } catch {
    return fallback
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()
  const { id } = await params

  const { data: campaign, error } = await db(supabase)
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = await params

  const { error } = await db(supabase)
    .from("donation_campaigns")
    .delete()
    .eq("id", id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
