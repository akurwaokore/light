import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - A member's friends list, gated by their friends_visibility setting:
//   public  -> any logged-in user
//   friends -> only the member's accepted friends (or the member themselves)
//   private -> only the member themselves
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: profileId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: target, error: targetError } = await supabase
      .from("profiles")
      .select("id, friends_visibility")
      .eq("id", profileId)
      .maybeSingle()

    if (targetError || !target) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const isSelf = user.id === profileId
    const visibility = target.friends_visibility || "friends"

    // Collect the target's accepted friendships (we need these both to gate
    // "friends"-visibility access and to return the list itself).
    const { data: friendships, error: fErr } = await supabase
      .from("friendships")
      .select(`
        user_id,
        friend_id,
        requester:profiles!friendships_user_id_fkey(id, display_name, photo_url, campus, job_title, company),
        recipient:profiles!friendships_friend_id_fkey(id, display_name, photo_url, campus, job_title, company)
      `)
      .eq("status", "accepted")
      .or(`user_id.eq.${profileId},friend_id.eq.${profileId}`)

    if (fErr) {
      console.error("[profile friends] query error:", fErr)
      return NextResponse.json({ error: fErr.message }, { status: 500 })
    }

    const friends = (friendships || [])
      .map((f: any) => {
        const isRequester = f.user_id === profileId
        const other = isRequester ? f.recipient : f.requester
        return other
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (a.display_name || "").localeCompare(b.display_name || ""))

    // Decide whether the viewer is allowed to see the list.
    let canView = isSelf || visibility === "public"
    if (!canView && visibility === "friends") {
      canView = friends.some((p: any) => p.id === user.id)
    }

    if (!canView) {
      return NextResponse.json({ visible: false, friends: [], count: friends.length })
    }

    return NextResponse.json({ visible: true, friends, count: friends.length })
  } catch (error: any) {
    console.error("[profile friends] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
