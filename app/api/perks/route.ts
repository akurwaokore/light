import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - list member perks from the `perks` table (replaces the old hardcoded
// mockPerks). Active perks are public; the partner's display name is resolved
// from profiles when an owner is set.
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: perks, error } = await supabase
      .from("perks")
      .select("id, business, owner_id, description, discount, category, logo_url, is_verified, status, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[perks] fetch error:", error.message)
      return NextResponse.json({ perks: [] })
    }

    // Resolve owner display names in one batch (avoids relying on a PostgREST FK embed).
    const ownerIds = Array.from(new Set((perks || []).map((p) => p.owner_id).filter(Boolean)))
    let ownerNames: Record<string, string> = {}
    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from("profiles")
        .select("id, display_name, full_name")
        .in("id", ownerIds as string[])
      ownerNames = Object.fromEntries(
        (owners || []).map((o: any) => [o.id, o.full_name || o.display_name || "Alumni Partner"]),
      )
    }

    const normalized = (perks || []).map((p) => ({
      id: p.id,
      business: p.business,
      description: p.description,
      discount: p.discount,
      category: p.category,
      logoURL: p.logo_url,
      owner: p.owner_id ? ownerNames[p.owner_id] || "Alumni Partner" : "Alumni Partner",
      is_verified: p.is_verified,
    }))

    return NextResponse.json({ perks: normalized })
  } catch (error: any) {
    console.error("[perks] fetch error:", error.message)
    return NextResponse.json({ perks: [] })
  }
}

// POST - submit a business to be listed as a perk partner (starts as pending
// so an admin can verify/activate it).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const business = (body.business || body.businessName || "").trim()
    if (!business) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("perks")
      .insert({
        business,
        owner_id: user.id,
        description: body.description || body.natureOfBusiness || null,
        discount: body.discount || "Contact partner for offer",
        category: body.category || "Other",
        logo_url: body.logo_url || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[perks] create error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, perk: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { user }
}

// PATCH - admin: verify/activate, update status, or edit a perk.
// Body: { id, status?, is_verified?, ...fields }
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const guard = await requireAdmin(supabase)
    if (guard.error) return guard.error

    const body = await request.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "Perk id is required" }, { status: 400 })

    const allowed = ["business", "description", "discount", "category", "logo_url", "status", "is_verified"]
    const updates: Record<string, any> = {}
    for (const key of allowed) if (key in rest) updates[key] = rest[key]
    // A common admin action is "approve" → activate + mark verified.
    if (rest.action === "approve") {
      updates.status = "active"
      updates.is_verified = true
    }
    if (rest.action === "reject") updates.status = "rejected"

    const { data, error } = await supabase.from("perks").update(updates).eq("id", id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, perk: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - admin: remove a perk. /api/perks?id=<uuid>
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const guard = await requireAdmin(supabase)
    if (guard.error) return guard.error

    const id = new URL(request.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Perk id is required" }, { status: 400 })

    const { error } = await supabase.from("perks").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
