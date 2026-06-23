import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { productId, amount, sellerId } = body

    // 1. Record transaction
    const { data: transaction, error: transError } = await supabase
      .from("marketplace_transactions")
      .insert({
        product_id: productId,
        buyer_id: user.id,
        seller_id: sellerId,
        amount: amount,
        status: "completed"
      })
      .select()
      .single()

    if (transError) throw transError

    // 2. Mark product as sold
    await supabase
      .from("products")
      .update({ status: "sold" })
      .eq("id", productId)

    // 3. Award points to buyer (1 point per 1000 KES spent)
    const points = Math.floor(amount / 1000)
    if (points > 0) {
      const { error: pointsError } = await supabase.rpc("award_points", {
        p_user_id: user.id,
        p_points: points,
        p_type: "earn",
        p_reason: "Marketplace purchase",
        p_reference_id: productId,
        p_reference_type: "marketplace_purchase"
      })
      if (pointsError) {
        console.error("[Purchase API] Failed to award points:", pointsError)
      }
    }

    // 4. Create notification for seller
    const { data: product } = await supabase
      .from("products")
      .select("title")
      .eq("id", productId)
      .single()

    console.log("[Purchase API] Creating notification for seller:", sellerId)
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: sellerId,
      type: "marketplace_purchase",
      title: "New Order Received!",
      content: `Congratulations! ${user.user_metadata?.full_name || 'Someone'} has ordered your item: ${product?.title || 'an item'}. Contact the buyer to arrange delivery.`,
      action_url: "/profile/listings",
      metadata: {
        productId,
        transactionId: transaction.id,
        buyerId: user.id,
        buyerName: user.user_metadata?.full_name
      }
    })

    if (notifError) {
      console.error("[Purchase API] Notification error:", notifError)
    } else {
      console.log("[Purchase API] Notification created successfully")
    }

    // 5. Fetch seller profile for success dialog
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("id, full_name, phone_number, avatar_url, bio, status, degree, graduation_year")
      .eq("id", sellerId)
      .single()

    return NextResponse.json({ 
      success: true, 
      transaction,
      seller: sellerProfile
    })
  } catch (error: any) {
    console.error("[Purchase API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
