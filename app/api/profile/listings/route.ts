import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { normalizeMarketplaceProduct } from "@/lib/marketplace"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        seller:profiles(id, display_name, email, photo_url)
      `)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json((data || []).map(normalizeMarketplaceProduct))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
