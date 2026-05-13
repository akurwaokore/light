import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = await params
  const body = await request.json()

  const { data: product, error } = await supabase!
    .from("products")
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  // If product status is updated to 'sold' or 'completed', award points to the seller
  if (body.status === 'sold' || body.status === 'completed') {
    const pointsToAward = 50 // 50 points for a completed sale
    const reason = `Completed sale of ${product.title}`
    
    await supabase!.rpc('award_points', {
      p_user_id: product.seller_id,
      p_points: pointsToAward,
      p_type: 'earn',
      p_reason: reason,
      p_reference_id: product.id,
      p_reference_type: 'sale'
    })
  }

  return NextResponse.json(product)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = await params

  const { error } = await supabase!
    .from("products")
    .delete()
    .eq("id", id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
