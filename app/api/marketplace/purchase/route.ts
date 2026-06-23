import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { productId, amount, sellerId } = body
    const numericAmount = Number(amount)

    if (!productId || !sellerId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid purchase payload" }, { status: 400 })
    }

    if (sellerId === user.id) {
      return NextResponse.json({ error: "You cannot buy your own listing" }, { status: 400 })
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, seller_id, status, price")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (product.seller_id !== sellerId) {
      return NextResponse.json({ error: "Seller mismatch for this product" }, { status: 400 })
    }

    if (product.status === "sold") {
      return NextResponse.json({ error: "This listing has already been sold" }, { status: 409 })
    }

    // 1. Record transaction
    const { data: transaction, error: transError } = await supabase
      .from("marketplace_transactions")
      .insert({
        product_id: productId,
        buyer_id: user.id,
        seller_id: sellerId,
        amount: numericAmount,
        status: "completed"
      })
      .select()
      .single()

    if (transError) throw transError

    // 2. Mark product as sold
    await supabase
      .from("products")
      .update({ status: "sold", updated_at: new Date().toISOString() })
      .eq("id", productId)

    // 3. Award points through the database function used elsewhere in the app.
    await supabase.rpc("award_points", {
      p_user_id: user.id,
      p_points: Number.parseFloat((numericAmount * 0.0001).toFixed(4)),
      p_type: "earn",
      p_reason: "Marketplace purchase",
      p_reference_id: transaction.id,
      p_reference_type: "purchase",
      p_metadata: { productId, sellerId },
    })

    // 4. Create notification for seller
    console.log("[Purchase API] Creating notification for seller:", sellerId)
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: sellerId,
      type: "marketplace_purchase",
      title: "New Order Received!",
      message: `Congratulations! ${user.user_metadata?.full_name || "Someone"} has ordered your item: ${product.title || "an item"}. Contact the buyer to arrange delivery.`,
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
      .select("id, full_name, display_name, phone, phone_number, avatar_url, photo_url, bio, status, degree, graduation_year")
      .eq("id", sellerId)
      .single()

    return NextResponse.json({ 
      success: true, 
      transaction,
      seller: sellerProfile
        ? {
            ...sellerProfile,
            full_name: sellerProfile.full_name || sellerProfile.display_name || "Seller",
            avatar_url: sellerProfile.avatar_url || sellerProfile.photo_url || null,
            phone_number: sellerProfile.phone_number || sellerProfile.phone || null,
          }
        : null,
    })
  } catch (error: any) {
    console.error("[Purchase API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
