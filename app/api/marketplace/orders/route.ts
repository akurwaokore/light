import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - the caller's orders (buyer side by default; ?role=seller for sales).
// RLS already restricts rows to buyer/seller, this just shapes the query.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const role = request.nextUrl.searchParams.get("role") === "seller" ? "seller" : "buyer"
    const col = role === "seller" ? "seller_id" : "buyer_id"

    const { data, error } = await supabase
      .from("orders")
      .select(`id, status, subtotal, total, currency, payment_provider, created_at, paid_at,
               buyer_id, seller_id, items:order_items(id, product_id, title_snapshot, unit_price, quantity, line_total)`)
      .eq(col, user.id)
      .order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ orders: data || [], role })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
