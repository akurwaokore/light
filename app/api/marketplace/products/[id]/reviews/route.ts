import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - reviews for a product (+ aggregate)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: reviews, error } = await supabase
      .from("product_reviews")
      .select(`id, rating, body, created_at, reviewer:profiles!product_reviews_reviewer_id_fkey(id, display_name, photo_url)`)
      .eq("product_id", id)
      .order("created_at", { ascending: false })
    if (error) throw error
    const count = reviews?.length || 0
    const avg = count ? reviews!.reduce((s: number, r: any) => s + r.rating, 0) / count : 0
    return NextResponse.json({ reviews: reviews || [], avg_rating: Number(avg.toFixed(2)), review_count: count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - leave a review { orderId, rating, body }. RLS enforces purchaser-only.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orderId, rating, body } = await request.json()
    const r = Math.round(Number(rating))
    if (!orderId || !(r >= 1 && r <= 5)) return NextResponse.json({ error: "orderId and rating 1-5 required" }, { status: 400 })

    // seller_id is required by the table; derive it from the order item.
    const { data: oi } = await supabase
      .from("order_items").select("seller_id").eq("order_id", orderId).eq("product_id", id).maybeSingle()
    if (!oi) return NextResponse.json({ error: "No matching purchased item" }, { status: 403 })

    const { data: review, error } = await supabase
      .from("product_reviews")
      .insert({ product_id: id, order_id: orderId, reviewer_id: user.id, seller_id: oi.seller_id, rating: r, body: body || null })
      .select("id, rating, body, created_at")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 403 })
    return NextResponse.json({ review })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
