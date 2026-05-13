import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    for (const participation of (myParticipations || [])) {
      const convId = participation.conversation_id
      const { data: conversationRows, error: convError } = await supabase
        .from("chat_conversations")
        .select("id, updated_at")
        .eq("id", convId)
        .limit(1)

      const conversation = conversationRows?.[0]

      if (convError || !conversation) {
        if (convError) console.error("[Chat API] Conversation lookup error:", convError)
        continue
      }

      // Get the other participant's basic participant row first
      const { data: otherPartRows, error: otherPartError } = await supabase
        .from("chat_participants")
        .select("user_id")
        .eq("conversation_id", convId)
        .neq("user_id", user.id)
        .limit(1)

      if (otherPartError) {
        console.error("[Chat API] Other participant lookup error:", otherPartError)
        continue
      }

      const otherPartBase = otherPartRows?.[0]

      if (otherPartBase?.user_id) {
        // Fetch profile separately to avoid brittle nested relation failures
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name, photo_url")
          .eq("id", otherPartBase.user_id)
          .maybeSingle()

        // Get the most recent message
        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("content, created_at, is_read, sender_id")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        const safeConversation = {
          ...conversation,
          last_message: lastMsg ? [lastMsg] : [],
        }

        const safeOtherParticipant = {
          user_id: otherPartBase.user_id,
          user: profile || {
            id: otherPartBase.user_id,
            display_name: "Unknown User",
            photo_url: null,
          },
        }

        conversations.push({
          conversation_id: convId,
          conversation: safeConversation,
          other_participant: safeOtherParticipant,
        })
      }
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
