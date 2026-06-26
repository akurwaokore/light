import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Public read of active donation campaigns for the member-facing giving page.
// donation_campaigns has RLS keyed off profiles.role (which this app doesn't
// set), so use the service-role client when available, falling back to the
// user-scoped client.
async function db() {
  try {
    return createAdminClient()
  } catch {
    return await createServerClient()
  }
}

export async function GET() {
  const supabase = await db()

  const { data, error } = await supabase
    .from("donation_campaigns")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  // Normalise to the shape the giving page expects.
  const campaigns = (data || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    goal: Number(c.target_amount) || 0,
    raised: Number(c.current_amount) || 0,
    imageURL: c.image_url || null,
    currency: c.currency || "KES",
  }))

  return NextResponse.json(campaigns)
}
