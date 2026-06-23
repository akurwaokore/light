import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

async function getAccessToken(): Promise<string> {
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
  return access_token
}

// PayPal redirects the buyer's browser here after they approve the payment.
// We capture the authorized order, persist the membership, then redirect to
// the payments page with a status the UI can render.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token") // PayPal order id
  const payerId = searchParams.get("PayerID")

  try {
    if (!token) {
      return NextResponse.redirect(new URL("/payments?status=error&message=missing_token", request.url))
    }

    // Sandbox approval links may omit PayerID when the buyer cancels mid-flow.
    if (!payerId) {
      return NextResponse.redirect(new URL("/payments?status=cancelled", request.url))
    }

    const accessToken = await getAccessToken()

    // Capture payment for the order
    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${token}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    const captureData = await captureResponse.json()

    if (!captureResponse.ok) {
      const message = captureData.message || "Failed to capture PayPal payment"
      console.error("[paypal/success] capture failed:", captureData)
      return NextResponse.redirect(
        new URL(`/payments?status=failed&message=${encodeURIComponent(message)}`, request.url),
      )
    }

    // Persist membership on success (best-effort; capture already completed).
    try {
      const supabase = await createServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const tier = "silver"
        const startDate = new Date()
        const expiryDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()).toISOString()

        await supabase
          .from("profiles")
          .update({
            membership_tier: tier,
            membership_type: "annual",
            membership_start_date: startDate.toISOString(),
            membership_expiry: expiryDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "general",
          title: "Membership Activated! 🎊",
          message: `Congratulations! Your ${tier} membership is now active. Explore your new perks.`,
          link: "/profile",
          metadata: { real_type: "membership_activation", provider: "paypal", order_id: token },
        })
      }
    } catch (dbError) {
      // Payment was captured successfully; DB errors are non-fatal here.
      console.error("[paypal/success] non-fatal DB error:", dbError)
    }

    return NextResponse.redirect(new URL(`/payments?status=completed&orderId=${token}`, request.url))
  } catch (error: any) {
    console.error("[paypal/success] error:", error)
    return NextResponse.redirect(
      new URL(`/payments?status=error&message=${encodeURIComponent(error?.message || "paypal_error")}`, request.url),
    )
  }
}
