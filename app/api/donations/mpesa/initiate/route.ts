import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isMpesaConfigured, stkPush, normalizePhone } from "@/lib/mpesa"

// POST - Initiate an M-Pesa STK push for a donation.
export async function POST(request: NextRequest) {
  try {
    if (!isMpesaConfigured()) {
      return NextResponse.json(
        { error: "M-Pesa payments are not configured yet. Please contact the administrator." },
        { status: 503 },
      )
    }

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const amount = Number(body.amount)
    const phone = String(body.phone || "")
    const campaignId: string | null = body.campaignId || null

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 })
    }
    const normalized = normalizePhone(phone)
    if (!/^2547\d{8}$/.test(normalized) && !/^2541\d{8}$/.test(normalized)) {
      return NextResponse.json({ error: "Enter a valid Kenyan phone number (e.g. 0712345678)" }, { status: 400 })
    }

    // Service-role client for writing the pending donation row.
    let db: any = supabase
    try {
      db = createAdminClient()
    } catch {
      /* fall back to user client */
    }

    const { data: me } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()

    const result = await stkPush({
      phone: normalized,
      amount,
      accountReference: "Donation",
      description: "Donation",
    })

    if (result.ResponseCode !== "0") {
      return NextResponse.json(
        { error: result.errorMessage || result.ResponseDescription || "Failed to initiate payment" },
        { status: 502 },
      )
    }

    await db.from("donations").insert({
      campaign_id: campaignId,
      donor_id: user.id,
      donor_name: me?.display_name || null,
      amount,
      currency: "KES",
      phone: normalized,
      provider: "mpesa",
      status: "pending",
      checkout_request_id: result.CheckoutRequestID,
      merchant_request_id: result.MerchantRequestID,
    })

    return NextResponse.json({
      success: true,
      message: result.CustomerMessage || "Check your phone to authorise the payment.",
      checkoutRequestId: result.CheckoutRequestID,
    })
  } catch (error: any) {
    console.error("[mpesa/initiate] error:", error)
    return NextResponse.json({ error: error.message || "Payment failed to start" }, { status: 500 })
  }
}
