import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ unread_count: 0 })

    // 1. Get IDs of all conversations the user is a participant in
    const { data: participations, error: partError } = await supabase
      .from("chat_participants")
      .select("conversation_id")
      .eq("user_id", user.id)

    if (partError) throw partError
    
    const convIds = participations?.map(p => p.conversation_id) || []
    
    if (convIds.length === 0) {
      return NextResponse.json({ unread_count: 0 })
    }

    // 2. Count unread messages in those conversations sent by others
    const { count, error } = await supabase
      .from("chat_messages")
      .select("*", { count: 'exact', head: true })
      .in("conversation_id", convIds)
      .neq("sender_id", user.id)
      .eq("is_read", false)

    if (error) throw error

    return NextResponse.json({ unread_count: count || 0 })
  } catch (error: any) {
    console.error("[Chat Unread API] GET error:", error)
    return NextResponse.json({ unread_count: 0 })
  }
}
