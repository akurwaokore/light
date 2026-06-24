import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { initiateStkPush } from "@/lib/payments/mpesa"
import { failOrder } from "@/lib/marketplace/finalize-order"
import { type NextRequest, NextResponse } from "next/server"

// POST { provider: 'mpesa', phone?: string }
// Creates one order per seller from the cart (stock reserved atomically), then
// initiates payment. M-Pesa is supported now; pesapal/paypal are stubbed.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { provider, phone } = await request.json()
    if (provider !== "mpesa") {
      return NextResponse.json({ error: "Only M-Pesa is available at the moment" }, { status: 400 })
    }
    if (!phone) return NextResponse.json({ error: "Phone number is required for M-Pesa" }, { status: 400 })

    // Atomically create orders + reserve stock.
    const { data: orderIds, error: rpcErr } = await supabase.rpc("create_order_from_cart", {
      p_buyer: user.id,
      p_provider: provider,
    })
    if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 409 })
    if (!orderIds || orderIds.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 })

    const admin = createAdminClient()
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const callbackUrl = `${origin}/api/payments/mpesa/order-callback`

    const results: any[] = []
    for (const orderId of orderIds) {
      const { data: order } = await admin.from("orders").select("id, total").eq("id", orderId).single()
      const amount = Number(order?.total || 0)

      // Record the payment attempt (service role — no INSERT policy for users).
      const { data: payment } = await admin
        .from("payments")
        .insert({ order_id: orderId, buyer_id: user.id, provider, amount, status: "initiated" })
        .select("id")
        .single()

      try {
        const { checkoutRequestId } = await initiateStkPush({
          phone,
          amount,
          accountRef: orderId.slice(0, 12),
          description: "Order payment",
          callbackUrl,
        })
        await admin
          .from("payments")
          .update({ checkout_request_id: checkoutRequestId, status: "pending", updated_at: new Date().toISOString() })
          .eq("id", payment!.id)
        results.push({ orderId, checkoutRequestId, status: "pending" })
      } catch (e: any) {
        // STK push failed → release the reserved stock for this order.
        await failOrder(admin, { orderId, reason: e.message })
        results.push({ orderId, status: "failed", error: e.message })
      }
    }

    return NextResponse.json({ orders: results, message: "Check your phone to authorize the M-Pesa payment." })
  } catch (error: any) {
    console.error("[Checkout] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
