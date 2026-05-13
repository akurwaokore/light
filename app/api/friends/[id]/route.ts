import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// PUT - Accept or decline friend request
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await request.json() // 'accept' or 'decline'

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get the friendship to verify user is the recipient
    const { data: friendship, error: fetchError } = await supabase.from("friendships").select("*").eq("id", id).single()

    if (fetchError || !friendship) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 })
    }

    if (friendship.friend_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (action === "accept") {
      const { error } = await supabase
        .from("friendships")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // Create notification for the requester
      const { data: recipient } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()
      
      await supabase.from("notifications").insert([
        {
          user_id: friendship.user_id,
          type: "general",
          title: "Connection Accepted",
          message: `${recipient?.display_name || 'Someone'} accepted your connection request. You are now connected!`,
          link: `/members/${user.id}`,
          metadata: { friendship_id: id, recipient_id: user.id, real_type: "friend_accepted" }
        }
      ])

      return NextResponse.json({ message: "Friend request accepted" })
    } else {
      // Decline = delete the request
      const { error } = await supabase.from("friendships").delete().eq("id", id)

      if (error) throw error

      return NextResponse.json({ message: "Friend request declined" })
    }
  } catch (error: any) {
    console.error("Error updating friendship:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove friend / Cancel request
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("friendships").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Friendship removed" })
  } catch (error: any) {
    console.error("Error removing friendship:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
