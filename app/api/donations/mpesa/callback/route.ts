import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST - Daraja STK callback (server-to-server, no user session).
// Safaricom always expects a 200 with a ResultCode/ResultDesc acknowledgement.
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}))
    const stk = payload?.Body?.stkCallback

    if (!stk?.CheckoutRequestID) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored" })
    }

    let db
    try {
      db = createAdminClient()
    } catch (e) {
      console.error("[mpesa/callback] no service-role key configured")
      // Still ack so Safaricom doesn't retry forever.
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
    }

    const { data: donation } = await db
      .from("donations")
      .select("id, campaign_id, amount, status")
      .eq("checkout_request_id", stk.CheckoutRequestID)
      .maybeSingle()

    if (!donation) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
    }

    // Avoid double-processing a callback that already completed.
    if (donation.status === "completed") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Already processed" })
    }

    const success = stk.ResultCode === 0

    let receipt: string | null = null
    if (success && Array.isArray(stk.CallbackMetadata?.Item)) {
      const item = stk.CallbackMetadata.Item.find((i: any) => i.Name === "MpesaReceiptNumber")
      receipt = item?.Value ? String(item.Value) : null
    }

    await db
      .from("donations")
      .update({
        status: success ? "completed" : "failed",
        mpesa_receipt: receipt,
        result_desc: stk.ResultDesc || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", donation.id)

    // On success, add to the campaign's running total.
    if (success && donation.campaign_id) {
      const { error: rpcError } = await db.rpc("increment_campaign_amount", {
        p_campaign_id: donation.campaign_id,
        p_amount: Number(donation.amount),
      })
      if (rpcError) {
        // Fallback if the RPC isn't present: best-effort manual increment.
        const { data: camp } = await db
          .from("donation_campaigns")
          .select("current_amount")
          .eq("id", donation.campaign_id)
          .maybeSingle()
        await db
          .from("donation_campaigns")
          .update({ current_amount: Number(camp?.current_amount || 0) + Number(donation.amount) })
          .eq("id", donation.campaign_id)
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
  } catch (error: any) {
    console.error("[mpesa/callback] error:", error)
    // Acknowledge regardless so Safaricom stops retrying; we log for debugging.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
  }
}
