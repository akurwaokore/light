import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkAdminAccess } from "@/lib/admin-auth"

// POST - Start or get a conversation
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { recipientId } = await request.json()
    if (!recipientId) return NextResponse.json({ error: "Recipient ID required" }, { status: 400 })

    if (user.id === recipientId) {
      return NextResponse.json({ error: "You cannot chat with yourself" }, { status: 400 })
    }

    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", recipientId)
      .maybeSingle()

    if (!recipientProfile) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Messaging is restricted to users who have an accepted connection.
    // Admins may message anyone (support/moderation).
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .eq("status", "accepted")
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${recipientId}),and(user_id.eq.${recipientId},friend_id.eq.${user.id})`,
      )
      .maybeSingle()

    if (!friendship) {
      const admin = await checkAdminAccess()
      if (!admin.authorized) {
        return NextResponse.json(
          { error: "You can only message people you are connected with." },
          { status: 403 },
        )
      }
    }

    console.log(`[Chat API] POST request from ${user.id} to ${recipientId}`)

    // Use RPC to atomically get or create the conversation
    const { data: convId, error: ensureError } = await supabase
      .rpc("ensure_chat_conversation", { initiator_uuid: user.id, recipient_uuid: recipientId })

    if (ensureError || !convId) {
      console.error("[Chat API] ensure_chat_conversation error:", ensureError)
      return NextResponse.json({ error: "Failed to start conversation", details: ensureError?.message }, { status: 500 })
    }

    return NextResponse.json({ conversationId: convId })
  } catch (error: any) {
    console.error("[Chat API] Unexpected POST error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// GET - List user's conversations
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ conversations: [] })

    // Fetch all conversations where user is a participant
    const { data: myParticipations, error: partError } = await supabase
      .from("chat_participants")
      .select("conversation_id")
      .eq("user_id", user.id)

    if (partError) {
      console.error("[Chat API] GET participants error:", partError)
      return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 })
    }

    const conversations: any[] = []

    for (const participation of myParticipations || []) {
      const convId = participation.conversation_id
      const [{ data: conversationRows, error: convError }, { data: otherPartRows, error: otherPartError }, { data: lastMsg }] =
        await Promise.all([
          supabase.from("chat_conversations").select("id, updated_at").eq("id", convId).limit(1),
          supabase.from("chat_participants").select("user_id").eq("conversation_id", convId).neq("user_id", user.id).limit(1),
          supabase
            .from("chat_messages")
            .select("content, created_at, is_read, sender_id")
            .eq("conversation_id", convId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

      const conversation = conversationRows?.[0]
      const otherPartBase = otherPartRows?.[0]

      if (convError || otherPartError || !conversation || !otherPartBase?.user_id) {
        if (convError) console.error("[Chat API] Conversation lookup error:", convError)
        if (otherPartError) console.error("[Chat API] Other participant lookup error:", otherPartError)
        continue
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, photo_url")
        .eq("id", otherPartBase.user_id)
        .maybeSingle()

      conversations.push({
        conversation_id: convId,
        conversation: {
          ...conversation,
          last_message: lastMsg ? [lastMsg] : [],
        },
        other_participant: {
          user_id: otherPartBase.user_id,
          user: profile || {
            id: otherPartBase.user_id,
            display_name: "Unknown User",
            photo_url: null,
          },
        },
      })
    }

    // Sort by most recent activity
    conversations.sort((a, b) => {
      const dateA = new Date((a.conversation as any).updated_at).getTime()
      const dateB = new Date((b.conversation as any).updated_at).getTime()
      return dateB - dateA
    })

    return NextResponse.json({ conversations })
  } catch (error: any) {
    console.error("[Chat API] Unexpected GET error:", error)
    return NextResponse.json({ error: "Failed to load conversations", conversations: [] }, { status: 500 })
  }
}
