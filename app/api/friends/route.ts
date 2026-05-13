import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - Get all friends and pending requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ friends: [] })

    const status = request.nextUrl.searchParams.get("status")

    // Fetch friendships where user is either requester or recipient
    const { data: friendships, error } = await supabase
      .from("friendships")
      .select(`
        id,
        status,
        requested_at:created_at,
        accepted_at,
        user_id,
        friend_id,
        requester:profiles!friendships_user_id_fkey(id, display_name, photo_url, campus, job_title, company),
        recipient:profiles!friendships_friend_id_fkey(id, display_name, photo_url, campus, job_title, company)
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    if (error) {
      console.error("[Friends API] Query error:", error)
      return NextResponse.json({ friends: [], error: error.message })
    }

    // Format for the frontend
    const formattedFriends = friendships
      ?.filter(f => {
        // If status is provided, filter by it. Otherwise return all (useful for pending/sent)
        if (status && f.status !== status) return false
        
        const otherProfile = f.user_id === user.id ? f.recipient : f.requester
        return !!otherProfile
      })
      .map(f => {
        const isRequester = f.user_id === user.id
        const profile: any = isRequester ? f.recipient : f.requester
        return {
          id: f.id,
          status: f.status,
          requested_at: f.requested_at,
          accepted_at: f.accepted_at,
          is_requester: isRequester,
          profile: {
            ...profile,
            display_name: profile?.display_name || "Unknown User"
          }
        }
      })
      .sort((a, b) => (a.profile.display_name || "").localeCompare(b.profile.display_name || ""))

    return NextResponse.json({ friends: formattedFriends || [] })
  } catch (error: any) {
    console.error("[Friends API] GET error:", error)
    return NextResponse.json({ friends: [] })
  }
}

// POST - Send friend request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { friend_id } = await request.json()

    // Prevent duplicate or self-request
    if (friend_id === user.id) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 })

    const { data, error } = await supabase
      .from("friendships")
      .insert([
        {
          user_id: user.id,
          friend_id: friend_id,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("[Friends API] Insert error:", error)
      if (error.code === '23505') return NextResponse.json({ error: "Request already exists" }, { status: 400 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create notification for the recipient
    const { data: requester } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()
    
    if (data) {
      const { error: notificationError } = await supabase.from("notifications").insert([
        {
          user_id: friend_id,
          type: "general",
          title: "New Connection Request",
          message: `${requester?.display_name || 'Someone'} sent you a connection request.`,
          link: "/friends",
          metadata: { friendship_id: data.id, requester_id: user.id, real_type: "friend_request" }
        }
      ])

      if (notificationError) {
        console.error("[Friends API] Notification error:", notificationError)
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[Friends API] POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
