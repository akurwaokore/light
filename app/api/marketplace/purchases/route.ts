import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { normalizeMarketplaceProduct } from "@/lib/marketplace"

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: purchases, error } = await supabase
      .from("marketplace_transactions")
      .select(`
        id,
        amount,
        status,
        created_at,
        buyer_id,
        seller_id,
        product:products(
          *,
          seller:profiles(id, display_name, photo_url)
        )
      `)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      purchases: (purchases || []).map((purchase: any) => ({
        id: purchase.id,
        amount: Number(purchase.amount || 0),
        status: purchase.status ?? "completed",
        created_at: purchase.created_at,
        buyer_id: purchase.buyer_id,
        seller_id: purchase.seller_id,
        product: purchase.product ? normalizeMarketplaceProduct(purchase.product) : null,
      })),
    })
  } catch (error: any) {
    console.error("[Marketplace Purchases API] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch purchases" }, { status: 500 })
  }
}
