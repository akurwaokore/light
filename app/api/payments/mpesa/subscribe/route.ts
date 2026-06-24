import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { initiateStkPush } from "@/lib/payments/mpesa"
import { type NextRequest, NextResponse } from "next/server"

// Subscription tiers -> price (KES) + the membership_tier they grant.
const TIERS: Record<string, { price: number; tier: string; lifetime: boolean; name: string }> = {
  annual: { price: 1000, tier: "gold", lifetime: false, name: "Annual Membership" },
  lifetime: { price: 10000, tier: "platinum", lifetime: true, name: "Lifetime Membership" },
}

// POST { tierId, phone } -> initiate an M-Pesa STK push for a membership subscription.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { tierId, phone } = await request.json()
    const tier = TIERS[tierId]
    if (!tier) return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    if (!/^2547\d{8}$/.test(phone || "")) return NextResponse.json({ error: "Phone must be 2547XXXXXXXX" }, { status: 400 })

    const admin = createAdminClient()
    const { data: tx, error: txErr } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email || "Member",
        type: "subscription",
        amount: tier.price,
        currency: "KES",
        payment_method: "mpesa",
        status: "pending",
        description: tier.name,
        reference_id: tierId,
        phone_number: phone,
        metadata: { tier: tier.tier, lifetime: tier.lifetime },
      })
      .select("id")
      .single()
    if (txErr) throw txErr

    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    try {
      const { checkoutRequestId } = await initiateStkPush({
        phone,
        amount: tier.price,
        accountRef: "Membership",
        description: tier.name,
        callbackUrl: `${origin}/api/payments/mpesa/subscribe-callback`,
      })
      await admin.from("transactions").update({ checkout_request_id: checkoutRequestId, updated_at: new Date().toISOString() }).eq("id", tx.id)
      return NextResponse.json({ success: true, checkoutRequestId, message: "Check your phone to authorize the M-Pesa payment." })
    } catch (e: any) {
      await admin.from("transactions").update({ status: "failed", error_message: e.message, updated_at: new Date().toISOString() }).eq("id", tx.id)
      // Surface a clear message when sandbox keys aren't configured yet.
      return NextResponse.json({ error: e.message || "Could not initiate M-Pesa payment" }, { status: 502 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
