import { type NextRequest, NextResponse } from "next/server"
import { getPesapalClient } from "@/lib/pesapal"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderTrackingId = searchParams.get("OrderTrackingId")
    const orderMerchantReference = searchParams.get("OrderMerchantReference")

    if (!orderTrackingId) {
      return NextResponse.json({ error: "OrderTrackingId is required" }, { status: 400 })
    }

    const pesapal = await getPesapalClient()
    const statusResponse = await pesapal.getTransactionStatus(orderTrackingId)

    // Log for debugging
    console.log("Pesapal transaction status response:", statusResponse)

    // Handle database update on success
    if (statusResponse.payment_status_description === "Completed") {
      const supabase = await createServerClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Determine membership tier from reference (e.g., "annual-ORDER-123")
        const isLifetime = orderMerchantReference?.toLowerCase().includes("lifetime")
        const tier = isLifetime ? "platinum" : "silver"
        
        const startDate = new Date()
        const expiryDate = isLifetime 
          ? null 
          : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()).toISOString()

        // Update profile
        await supabase
          .from("profiles")
          .update({
            membership_tier: tier,
            membership_type: isLifetime ? "lifetime" : "annual",
            membership_start_date: startDate.toISOString(),
            membership_expiry: expiryDate,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id)

        // Create notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "general",
          title: "Membership Activated! 🎊",
          message: `Congratulations! Your ${tier} membership is now active. Explore your new perks.`,
          link: "/profile",
          metadata: { real_type: "membership_activation" }
        })
      }
      
      return NextResponse.redirect(new URL(`/payments?status=completed&trackingId=${orderTrackingId}`, request.url))
    }

    return NextResponse.redirect(new URL(`/payments?status=failed&trackingId=${orderTrackingId}`, request.url))
  } catch (error: any) {
    console.error("Pesapal callback error:", error)
    return NextResponse.redirect(new URL(`/payments?status=error&message=${encodeURIComponent(error.message)}`, request.url))
  }
}
