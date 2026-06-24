import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - the caller's seller dashboard stats (earnings + order counts).
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, status, total")
      .eq("seller_id", user.id)
    if (error) throw error

    const paid = (orders || []).filter((o: any) => ["paid", "fulfilled"].includes(o.status))
    const earnings = paid.reduce((s: number, o: any) => s + Number(o.total || 0), 0)
    const pending = (orders || []).filter((o: any) => o.status === "pending_payment").length

    const { count: listingCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", user.id)

    return NextResponse.json({
      earnings,
      paid_orders: paid.length,
      pending_orders: pending,
      total_orders: orders?.length || 0,
      listings: listingCount || 0,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
