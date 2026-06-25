import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get user from auth if not provided in body
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { clubId, userId: bodyUserId } = body
    const userId = bodyUserId || user?.id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[akurwas] User joining club:", { clubId, userId })

    // Check if already a member
    const { data: existingRows, error: existingError } = await supabase
      .from("club_memberships")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", userId)
      .limit(1)

    if (existingError) throw existingError

    const existing = existingRows && existingRows.length > 0

    if (existing) {
      // Toggle off: Leave club
      const { error: leaveError } = await supabase
        .from("club_memberships")
        .delete()
        .eq("club_id", clubId)
        .eq("user_id", userId)

      if (leaveError) throw leaveError
      return NextResponse.json({ success: true, action: "left" })
    }

    // Insert membership
    const { data: membership, error: membershipError } = await supabase
      .from("club_memberships")
      .insert({
        club_id: clubId,
        user_id: userId,
      })
      .select()
      .single()

    if (membershipError) throw membershipError

    // Create notification for club owner
    const { data: club } = await supabase
      .from("clubs")
      .select("name, created_by")
      .eq("id", clubId)
      .single()

    if (club && club.created_by && club.created_by !== userId) {
      await supabase.from("notifications").insert({
        user_id: club.created_by,
        type: "club_join",
        title: "New Club Member!",
        message: `${user?.user_metadata?.full_name || 'Someone'} has joined your club: ${club.name}`,
        link: `/clubs/${clubId}`,
        metadata: { clubId, userId }
      })
    }

    // Note: Points are now awarded automatically via database trigger (on_club_joined_award_points)
    // to ensure consistency and prevent double-awarding.

    return NextResponse.json({
      success: true,
      membership,
      pointsAwarded: 5,
    })
  } catch (error) {
    console.error("[akurwas] Error joining club:", error)
    return NextResponse.json({ error: "Failed to join club" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("clubId")
    const userId = searchParams.get("userId")

    if (!clubId || !userId) {
      return NextResponse.json({ error: "Missing clubId or userId" }, { status: 400 })
    }

    const { error } = await supabase.from("club_memberships").delete().eq("club_id", clubId).eq("user_id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[akurwas] Error leaving club:", error)
    return NextResponse.json({ error: "Failed to leave club" }, { status: 500 })
  }
}
