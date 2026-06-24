import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Get-or-create the caller's cart id.
async function getCartId(supabase: any, buyerId: string): Promise<string> {
  const { data: existing } = await supabase.from("carts").select("id").eq("buyer_id", buyerId).maybeSingle()
  if (existing?.id) return existing.id
  const { data: created, error } = await supabase.from("carts").insert({ buyer_id: buyerId }).select("id").single()
  if (error) throw error
  return created.id
}

// GET - current cart with items + product details
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const cartId = await getCartId(supabase, user.id)
    const { data: items, error } = await supabase
      .from("cart_items")
      .select(`id, quantity, unit_price, product:products(id, title, price, currency, image_urls, images, image_url, status, quantity, seller_id, seller_name)`)
      .eq("cart_id", cartId)
      .order("added_at", { ascending: true })
    if (error) throw error

    const normalized = (items || []).map((it: any) => ({
      id: it.id,
      quantity: it.quantity,
      unit_price: Number(it.unit_price || 0),
      product: it.product,
      line_total: Number(it.unit_price || 0) * it.quantity,
    }))
    const total = normalized.reduce((s, i) => s + i.line_total, 0)
    return NextResponse.json({ cartId, items: normalized, total, count: normalized.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - add an item { productId, quantity }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { productId, quantity = 1 } = await request.json()
    const qty = Math.max(1, Math.floor(Number(quantity) || 1))
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id, price, status, quantity, seller_id, product_type")
      .eq("id", productId)
      .single()
    if (pErr || !product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    if (product.seller_id === user.id) return NextResponse.json({ error: "You cannot buy your own listing" }, { status: 400 })
    if (!["approved", "active"].includes(product.status)) return NextResponse.json({ error: "Product is not available" }, { status: 409 })

    const cartId = await getCartId(supabase, user.id)
    // Merge with any existing line for this product.
    const { data: existing } = await supabase
      .from("cart_items").select("id, quantity").eq("cart_id", cartId).eq("product_id", productId).maybeSingle()
    const desired = (existing?.quantity || 0) + qty
    const maxQty = product.product_type === "service" ? 1 : Number(product.quantity || 0)
    if (desired > maxQty) return NextResponse.json({ error: `Only ${maxQty} in stock` }, { status: 409 })

    if (existing) {
      await supabase.from("cart_items").update({ quantity: desired }).eq("id", existing.id)
    } else {
      await supabase.from("cart_items").insert({ cart_id: cartId, product_id: productId, quantity: qty, unit_price: product.price })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
