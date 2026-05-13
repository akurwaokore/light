import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// M-Pesa API Configuration
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE
const MPESA_PASSKEY = process.env.MPESA_PASSKEY
const MPESA_CALLBACK_URL =
  process.env.MPESA_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback`

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, amount, description } = await request.json()

    if (!phoneNumber || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // TODO: Implement actual M-Pesa Daraja API integration
    // This is a skeleton implementation

    // Step 1: Get OAuth token
    const authResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64")}`,
        },
      },
    )

    if (!authResponse.ok) {
      throw new Error("Failed to authenticate with M-Pesa")
    }

    const { access_token } = await authResponse.json()

    // Step 2: Generate timestamp and password
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14)
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64")

    // Step 3: Initiate STK Push
    const stkPushResponse = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.floor(amount),
        PartyA: phoneNumber,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: "Light Alumni Connect",
        TransactionDesc: description || "Membership Payment",
      }),
    })

    const stkData = await stkPushResponse.json()

    if (stkData.ResponseCode !== "0") {
      throw new Error(stkData.ResponseDescription || "STK Push failed")
    }

    // Store transaction in database
    const supabase = await createServerClient()
    const checkoutRequestId = stkData.CheckoutRequestID

    await supabase.from("transactions").insert({
      checkout_request_id: checkoutRequestId,
      phone_number: phoneNumber,
      amount,
      description,
      status: "pending",
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      checkoutRequestId,
      message: "STK Push sent successfully",
    })
  } catch (error: any) {
    console.error("M-Pesa STK Push error:", error)
    return NextResponse.json({ error: error.message || "Failed to initiate M-Pesa payment" }, { status: 500 })
  }
}
