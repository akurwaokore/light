import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - Get friend suggestions (Registered users not yet connected)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ suggestions: [] })

    // 1. Get IDs of existing friends/requests
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    const connectedIds = friendships?.map(f => f.user_id === user.id ? f.friend_id : f.user_id) || []
    connectedIds.push(user.id) // Exclude self

    // 2. Fetch profiles that are not in the connected list
    let query = supabase
      .from("profiles")
      .select("id, display_name, photo_url, campus, graduation_year, job_title, company")
    
    if (connectedIds.length > 0) {
      query = query.not("id", "in", `(${connectedIds.join(',')})`)
    }

    const { data: profiles, error } = await query.limit(20)

    if (error) throw error

    return NextResponse.json({ suggestions: profiles || [] })
  } catch (error: any) {
    console.error("[Suggestions API] GET error:", error)
    return NextResponse.json({ suggestions: [] })
  }
}
