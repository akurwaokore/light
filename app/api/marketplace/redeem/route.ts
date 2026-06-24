import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

// POST { productId } — acquire a product/service by spending loyalty points
// instead of money. Alumni can "change" their earned points for other alumni's
// products and services. Cost = price * points_multiplier (1:1 by default).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { productId } = await request.json()
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

    const { data: product } = await supabase
      .from("products")
      .select("id, title, price, seller_id, status, quantity, product_type")
      .eq("id", productId)
      .single()
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    if (product.seller_id === user.id) return NextResponse.json({ error: "You cannot redeem your own listing" }, { status: 400 })
    if (!["approved", "active"].includes(product.status)) return NextResponse.json({ error: "Product is not available" }, { status: 409 })
    if (Number(product.quantity || 0) < 1) return NextResponse.json({ error: "Out of stock" }, { status: 409 })

    // Redemption rate (admin-configurable via the points_multiplier setting).
    const { data: rateRow } = await supabase.from("system_settings").select("value").eq("key", "points_multiplier").maybeSingle()
    const multiplier = Number(rateRow?.value) > 0 ? Number(rateRow.value) : 1
    const cost = Math.ceil(Number(product.price || 0) * multiplier)

    // Buyer's current points (user_points is a view over profiles.points).
    const { data: pts } = await supabase.from("user_points").select("total_points").eq("user_id", user.id).maybeSingle()
    const balance = Number(pts?.total_points || 0)
    if (balance < cost) {
      return NextResponse.json({ error: `Not enough points. Need ${cost}, you have ${balance}.` }, { status: 402 })
    }

    // Fulfill via service role (orders/payments writes bypass user RLS).
    const admin = createAdminClient()
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        buyer_id: user.id, seller_id: product.seller_id, status: "paid",
        subtotal: cost, total: cost, currency: "POINTS", payment_provider: "points",
        paid_at: new Date().toISOString(),
      })
      .select("id").single()
    if (orderErr) throw orderErr

    await admin.from("order_items").insert({
      order_id: order.id, product_id: product.id, seller_id: product.seller_id,
      title_snapshot: product.title, unit_price: cost, quantity: 1, line_total: cost,
    })
    await admin.from("products").update({ quantity: Number(product.quantity) - 1, updated_at: new Date().toISOString() }).eq("id", product.id)

    // Deduct buyer points, reward the seller a portion.
    await admin.rpc("award_points", {
      p_user_id: user.id, p_points: -cost, p_type: "redeem", p_reason: `Redeemed: ${product.title}`,
      p_reference_id: order.id, p_reference_type: "purchase", p_metadata: { redeem: true },
    })
    await admin.rpc("award_points", {
      p_user_id: product.seller_id, p_points: Math.round(cost * 0.5), p_type: "earn",
      p_reason: `Points sale: ${product.title}`, p_reference_id: order.id, p_reference_type: "sale", p_metadata: { redeem: true },
    })
    await admin.from("notifications").insert({
      user_id: product.seller_id, type: "marketplace_purchase",
      title: "Item redeemed with points", message: `${product.title} was redeemed using loyalty points.`,
      action_url: `/marketplace/orders/${order.id}`, metadata: { orderId: order.id },
    })

    return NextResponse.json({ success: true, orderId: order.id, pointsSpent: cost })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
