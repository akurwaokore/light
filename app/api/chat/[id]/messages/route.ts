import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: participation } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!participation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) throw error

    // Map sender_id to 'me' if the message was sent by the current user
    const formattedMessages = messages?.map(m => ({
      ...m,
      sender_id: m.sender_id === user.id ? 'me' : m.sender_id
    })) || []

    return NextResponse.json(formattedMessages)
  } catch (error: any) {
    console.error("[Messages API] GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { content } = await request.json()
    if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 })

    const { data: participation } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!participation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: message, error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...message,
      sender_id: "me",
    })
  } catch (error: any) {
    console.error("[Messages API] POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
