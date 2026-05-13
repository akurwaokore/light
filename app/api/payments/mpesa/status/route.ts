import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const checkoutRequestId = searchParams.get("checkoutRequestId")

    if (!checkoutRequestId) {
      return NextResponse.json({ error: "Missing checkoutRequestId" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Query transaction status from database
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("checkout_request_id", checkoutRequestId)
      .single()

    if (error || !transaction) {
      return NextResponse.json({ status: "pending", message: "Transaction not found" })
    }

    return NextResponse.json({
      status: transaction.status,
      transactionId: transaction.id,
      message: transaction.status === "completed" ? "Payment successful" : "Payment pending",
    })
  } catch (error: any) {
    console.error("Status check error:", error)
    return NextResponse.json({ status: "pending", message: "Status check failed" })
  }
}
