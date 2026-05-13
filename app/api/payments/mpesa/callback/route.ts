import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[akurwas] M-Pesa callback received:", JSON.stringify(body, null, 2))

    const { Body } = body
    const { stkCallback } = Body

    const checkoutRequestId = stkCallback.CheckoutRequestID
    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc

    const supabase = await createServerClient()

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value
      const transactionDate = callbackMetadata.find((item: any) => item.Name === "TransactionDate")?.Value
      const phoneNumber = callbackMetadata.find((item: any) => item.Name === "PhoneNumber")?.Value

      const { data: transaction, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("checkout_request_id", checkoutRequestId)
        .single()

      if (!fetchError && transaction) {
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            mpesa_receipt: mpesaReceiptNumber,
            transaction_date: transactionDate,
            updated_at: new Date().toISOString(),
          })
          .eq("checkout_request_id", checkoutRequestId)

        // Award points for the purchase
        const pointsToAward = 10 // 10 points for each purchase
        await supabase.rpc('award_points', {
          p_user_id: transaction.user_id,
          p_points: pointsToAward,
          p_type: 'earn',
          p_reason: `Purchase of ${transaction.description || 'item'}`,
          p_reference_id: transaction.id,
          p_reference_type: 'purchase'
        })
      }

      console.log("[akurwas] Payment completed:", mpesaReceiptNumber)
    } else {
      // Payment failed or cancelled
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          error_message: resultDesc,
          updated_at: new Date().toISOString(),
        })
        .eq("checkout_request_id", checkoutRequestId)

      console.log("[akurwas] Payment failed:", resultDesc)
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
  } catch (error: any) {
    console.error("[akurwas] M-Pesa callback error:", error)
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed" }, { status: 500 })
  }
}
