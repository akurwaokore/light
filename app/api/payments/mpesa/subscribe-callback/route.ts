import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

// M-Pesa callback for membership subscriptions. Server-to-server: service-role,
// resolves the transaction by checkout_request_id, then grants membership.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const stk = body?.Body?.stkCallback
    if (!stk) return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored" })

    const checkoutRequestId = stk.CheckoutRequestID
    const admin = createAdminClient()

    const { data: tx } = await admin
      .from("transactions")
      .select("id, user_id, status, reference_id, metadata")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle()
    if (!tx) return NextResponse.json({ ResultCode: 0, ResultDesc: "No matching transaction" })
    if (tx.status === "completed") return NextResponse.json({ ResultCode: 0, ResultDesc: "Already processed" })

    if (stk.ResultCode === 0) {
      const meta = stk.CallbackMetadata?.Item || []
      const receipt = meta.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value

      await admin.from("transactions").update({
        status: "completed",
        mpesa_receipt: receipt ? String(receipt) : null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", tx.id)

      // Grant membership.
      const tier = tx.metadata?.tier || "gold"
      const lifetime = !!tx.metadata?.lifetime
      const expiry = lifetime ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      await admin.from("profiles").update({ membership_tier: tier, membership_expiry: expiry }).eq("id", tx.user_id)

      await admin.rpc("award_points", {
        p_user_id: tx.user_id, p_points: 100, p_type: "earn",
        p_reason: "Membership subscription", p_reference_id: tx.id, p_reference_type: "subscription",
        p_metadata: { tier },
      })
      await admin.from("notifications").insert({
        user_id: tx.user_id, type: "subscription",
        title: "Membership active", message: `Your ${tier} membership is now active.`,
        action_url: "/payments", metadata: { tier },
      })
    } else {
      await admin.from("transactions").update({
        status: "failed", error_message: stk.ResultDesc, updated_at: new Date().toISOString(),
      }).eq("id", tx.id)
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
  } catch (error: any) {
    console.error("[M-Pesa subscribe-callback] error:", error)
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Received" })
  }
}
