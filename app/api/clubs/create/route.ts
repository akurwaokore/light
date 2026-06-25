import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await request.json()
    const { name, description, category, icon } = body
    const userId = body.userId || user?.id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 })
    }

    console.log("[akurwas] Creating club:", { name, userId })

    // `slug` is NOT NULL and unique; derive it from the name and add a short
    // owner suffix so clubs with similar names don't collide.
    const baseSlug =
      String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "club"
    const slug = `${baseSlug}-${String(userId).slice(0, 8)}`

    // Insert club
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .insert({
        name,
        slug,
        description,
        category,
        icon: icon || "users",
        created_by: userId,
      })
      .select()
      .single()

    if (clubError) throw clubError

    // Automatically add creator as first member
    const { error: membershipError } = await supabase.from("club_memberships").insert({
      club_id: club.id,
      user_id: userId,
    })

    if (membershipError) throw membershipError

    // Note: 15 points will be awarded when club reaches 10 members via database trigger

    return NextResponse.json({
      success: true,
      club,
      message: "Club created! You'll earn 15 bonus points once your club reaches 10 members.",
    })
  } catch (error) {
    console.error("[akurwas] Error creating club:", error)
    return NextResponse.json({ error: "Failed to create club" }, { status: 500 })
  }
}
