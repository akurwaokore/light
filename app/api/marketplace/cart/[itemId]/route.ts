import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// PATCH - update quantity { quantity }. RLS ensures the item belongs to the caller's cart.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { quantity } = await request.json()
    const qty = Math.max(1, Math.floor(Number(quantity) || 1))

    // Confirm the item is in the caller's cart and check stock.
    const { data: item } = await supabase
      .from("cart_items")
      .select(`id, cart:carts!inner(buyer_id), product:products(quantity, product_type)`)
      .eq("id", itemId)
      .maybeSingle()
    if (!item || (item as any).cart?.buyer_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const product: any = (item as any).product
    const maxQty = product?.product_type === "service" ? 1 : Number(product?.quantity || 0)
    if (qty > maxQty) return NextResponse.json({ error: `Only ${maxQty} in stock` }, { status: 409 })

    const { error } = await supabase.from("cart_items").update({ quantity: qty }).eq("id", itemId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - remove an item (RLS scopes to caller's cart)
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase.from("cart_items").delete().eq("id", itemId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
