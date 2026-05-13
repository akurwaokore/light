import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: profileId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the target profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // If it's the user's own profile, return everything
    if (user.id === profileId) {
      return NextResponse.json(profile)
    }

    // Check friendship status
    const { data: friendship, error: friendshipError } = await supabase
      .from("friendships")
      .select("status, user_id")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${user.id})`)
      .maybeSingle()

    const isAccepted = friendship?.status === "accepted"

    // If not accepted, return restricted profile
    if (!isAccepted) {
      // Define what fields are public
      const publicProfile = {
        id: profile.id,
        display_name: profile.display_name,
        photo_url: profile.photo_url,
        campus: profile.campus,
        graduation_year: profile.graduation_year,
        is_restricted: true,
        friendship_status: friendship?.status || null,
        is_requester: friendship?.user_id === user.id,
      }
      return NextResponse.json(publicProfile)
    }

    // If accepted, return full profile
    return NextResponse.json({
      ...profile,
      is_restricted: false,
    })
  } catch (error: any) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
