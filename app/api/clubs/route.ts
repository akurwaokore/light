import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch clubs. Member counts are computed with a separate query because
    // club_memberships has no FK to clubs, so a PostgREST embed would fail.
    const { data: clubs, error } = await supabase
      .from("clubs")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("[akurwas] Error fetching clubs:", error)
      return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 })
    }

    const { data: allMemberships } = await supabase.from("club_memberships").select("club_id, user_id")
    const counts: Record<string, number> = {}
    for (const m of allMemberships || []) {
      counts[m.club_id] = (counts[m.club_id] || 0) + 1
    }

    const clubsWithCounts = (clubs || []).map((club) => ({
      ...club,
      members_count: counts[club.id] || club.member_count || 0,
    }))

    let userMemberships: string[] = []
    if (user) {
      userMemberships = (allMemberships || [])
        .filter((m) => m.user_id === user.id)
        .map((m) => m.club_id)
    }

    return NextResponse.json({ 
      clubs: clubsWithCounts || [],
      userMemberships,
      userId: user?.id
    })
  } catch (error) {
    console.error("[akurwas] Error in clubs route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
