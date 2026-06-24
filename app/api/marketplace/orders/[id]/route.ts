import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - a single order (receipt). RLS restricts to buyer/seller/admin.
// Counterparty contact is revealed via get_order_contact only when paid+.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: order, error } = await supabase
      .from("orders")
      .select(`id, status, subtotal, total, currency, payment_provider, created_at, paid_at,
               buyer_id, seller_id, items:order_items(id, product_id, title_snapshot, unit_price, quantity, line_total)`)
      .eq("id", id)
      .single()
    if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    const { data: contact } = await supabase.rpc("get_order_contact", { p_order_id: id })

    return NextResponse.json({ order, contact: contact || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
