import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

// Admin is verified in code; use the service-role client for the write so
// product RLS (owner-scoped) can't silently block edits/deletes of other
// users' listings.
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

  const { id } = await params
  const body = await request.json()

  // Drop fields that aren't real columns / shouldn't be overwritten blindly.
  const { id: _omitId, seller: _omitSeller, images: _omitImages, ...rest } = body || {}
  if (rest.category) rest.category = String(rest.category).toLowerCase()

  const { data: product, error } = await db(supabase)
    .from("products")
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  if (body.status === "sold" || body.status === "completed") {
    await db(supabase).rpc("award_points", {
      p_user_id: product.seller_id,
      p_points: 50,
      p_type: "earn",
      p_reason: `Completed sale of ${product.title}`,
      p_reference_id: product.id,
      p_reference_type: "sale",
    })
  }

  return NextResponse.json(product)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = await params

  const { data: deleted, error } = await db(supabase)
    .from("products")
    .delete()
    .eq("id", id)
    .select("id")

  if (error) return new NextResponse(error.message, { status: 500 })
  if (!deleted || deleted.length === 0) {
    return new NextResponse("Listing not found", { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
