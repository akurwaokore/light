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

    // Fetch clubs from database with member counts
    const { data: clubs, error } = await supabase
      .from("clubs")
      .select(`
        *,
        club_memberships(count)
      `)
      .order("name", { ascending: true })

    // Map counts correctly
    const clubsWithCounts = clubs?.map(club => ({
      ...club,
      members_count: club.club_memberships?.[0]?.count || 0
    }))

    let userMemberships: string[] = []
    if (user) {
      const { data: memberships } = await supabase
        .from("club_memberships")
        .select("club_id")
        .eq("user_id", user.id)
      
      if (memberships) {
        userMemberships = memberships.map(m => m.club_id)
      }
    }

    if (error) {
      console.error("[akurwas] Error fetching clubs:", error)
      return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 })
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
