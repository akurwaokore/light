import { createAdminClient } from "@/lib/supabase/admin"
import { finalizeOrder, failOrder } from "@/lib/marketplace/finalize-order"
import { type NextRequest, NextResponse } from "next/server"

// Dedicated M-Pesa callback for MARKETPLACE orders (separate from membership).
// Server-to-server: no user session, so it uses the service-role admin client
// and resolves the order via the payments.checkout_request_id, not auth.getUser().
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const stk = body?.Body?.stkCallback
    if (!stk) return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored" })

    const checkoutRequestId = stk.CheckoutRequestID
    const resultCode = stk.ResultCode
    const admin = createAdminClient()

    const { data: payment } = await admin
      .from("payments")
      .select("id, order_id, status")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle()

    if (!payment) {
      // Unknown reference (e.g. membership payment hits the other callback).
      return NextResponse.json({ ResultCode: 0, ResultDesc: "No matching order" })
    }

    if (resultCode === 0) {
      const meta = stk.CallbackMetadata?.Item || []
      const receipt = meta.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value
      await finalizeOrder(admin, {
        orderId: payment.order_id,
        provider: "mpesa",
        providerRef: receipt ? String(receipt) : checkoutRequestId,
        rawCallback: body,
      })
    } else {
      await failOrder(admin, { orderId: payment.order_id, reason: stk.ResultDesc, rawCallback: body })
    }

    // M-Pesa expects a 200 with this shape regardless.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
  } catch (error: any) {
    console.error("[M-Pesa order-callback] error:", error)
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Received" })
  }
}
