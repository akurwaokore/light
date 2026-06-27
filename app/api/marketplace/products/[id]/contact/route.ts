import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { toWhatsAppNumber } from "@/lib/utils"

// GET - Reveal the seller's contact details for a listing to a logged-in buyer.
// profiles.phone is hidden from non-friends by RLS, so we read it with the
// service-role client AFTER confirming the caller is authenticated.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: product } = await supabase
      .from("products")
      .select("id, seller_id, seller_name, seller_email")
      .eq("id", id)
      .maybeSingle()

    if (!product) return NextResponse.json({ error: "Listing not found" }, { status: 404 })

    let db: any = supabase
    try {
      db = createAdminClient()
    } catch {
      // No service-role key — fall back to the user client (may omit phone).
    }

    const { data: seller } = await db
      .from("profiles")
      .select("display_name, phone, phone_number, email")
      .eq("id", product.seller_id)
      .maybeSingle()

    const phone = seller?.phone || seller?.phone_number || null
    // wa.me needs a digits-only international number — a raw 07.. local number
    // (or one with +/spaces) makes the WhatsApp link fail to open a chat.
    const whatsapp = toWhatsAppNumber(phone)

    return NextResponse.json({
      sellerId: product.seller_id,
      name: seller?.display_name || product.seller_name || "Seller",
      phone,
      whatsapp,
      email: seller?.email || product.seller_email || null,
    })
  } catch (error: any) {
    console.error("[marketplace/contact] error:", error)
    return NextResponse.json({ error: "Failed to load contact details" }, { status: 500 })
  }
}
