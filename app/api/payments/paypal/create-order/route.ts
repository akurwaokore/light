import { type NextRequest, NextResponse } from "next/server"

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, description } = await request.json()

    if (!amount || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get PayPal access token
    const authResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    if (!authResponse.ok) {
      throw new Error("Failed to authenticate with PayPal")
    }

    const { access_token } = await authResponse.json()

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: description || "Light Alumni Connect Membership",
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "Light Alumni Connect",
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paypal/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments`,
        },
      }),
    })

    const orderData = await orderResponse.json()

    if (!orderResponse.ok) {
      throw new Error(orderData.message || "Failed to create PayPal order")
    }

    // Get approval URL
    const approvalUrl = orderData.links.find((link: any) => link.rel === "approve")?.href

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      approvalUrl,
    })
  } catch (error: any) {
    console.error("PayPal create order error:", error)
    return NextResponse.json({ error: error.message || "Failed to create PayPal order" }, { status: 500 })
  }
}
