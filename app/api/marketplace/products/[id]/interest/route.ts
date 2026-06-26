import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// POST - A buyer expresses interest in a listing. Notifies the seller.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const message: string | undefined = body?.message

    const { data: product } = await supabase
      .from("products")
      .select("id, title, seller_id")
      .eq("id", id)
      .maybeSingle()

    if (!product) return NextResponse.json({ error: "Listing not found" }, { status: 404 })

    if (product.seller_id === user.id) {
      return NextResponse.json({ error: "You cannot show interest in your own listing" }, { status: 400 })
    }

    const { data: me } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()

    const buyerName = me?.display_name || "Someone"

    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: product.seller_id,
      type: "general",
      title: "New interest in your listing",
      message: `${buyerName} is interested in "${product.title}".${message ? ` "${message}"` : ""}`,
      link: `/marketplace/${product.id}`,
      metadata: {
        real_type: "marketplace_interest",
        product_id: product.id,
        buyer_id: user.id,
      },
    })

    if (notifyError) {
      console.error("[marketplace/interest] notify error:", notifyError)
      return NextResponse.json({ error: "Could not notify the seller" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[marketplace/interest] error:", error)
    return NextResponse.json({ error: "Failed to register interest" }, { status: 500 })
  }
}
