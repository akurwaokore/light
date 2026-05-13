import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ notifications: [] })

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (unreadOnly) {
      query = query.eq("read", false)
    }

    const { data, error } = await query.limit(limit)

    if (error) throw error

    return NextResponse.json({ notifications: data || [] })
  } catch (error) {
    console.error("[Notifications API] GET error:", error)
    return NextResponse.json({ notifications: [] })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { notification_id, read, mark_all_read } = body

    if (mark_all_read) {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
      
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (notification_id) {
      const { error } = await supabase
        .from("notifications")
        .update({ read })
        .eq("id", notification_id)
        .eq("user_id", user.id)
      
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error: any) {
    console.error("[Notifications API] PATCH error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
