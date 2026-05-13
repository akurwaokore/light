import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { name, description, category, icon, userId } = body

    console.log("[akurwas] Creating club:", { name, userId })

    // Insert club
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .insert({
        name,
        description,
        category,
        icon: icon || "users",
        creator_id: userId,
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
