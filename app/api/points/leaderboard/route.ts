import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const campus = searchParams.get("campus")

    // Query user_points and join with profiles to get the full leaderboard data
    // Sort by points descending
    let query = supabase
      .from("user_points")
      .select(`
        user_id,
        total_points,
        profiles!inner(
          id,
          full_name,
          display_name,
          avatar_url,
          photo_url,
          campus,
          graduation_year
        )
      `)
      .order('total_points', { ascending: false })
      .limit(limit)

    // Filter by campus if specified and not 'all'
    if (campus && campus !== "all") {
      query = query.eq("profiles.campus", campus)
    }

    const { data: pointsData, error } = await query

    if (error) {
      console.error("[Leaderboard API] DB Query Error:", error)
      return NextResponse.json({ leaderboard: [] }, { status: 500 })
    }

    // Transform joined data into flat leaderboard format expected by UI
    const leaderboard = (pointsData || []).map((record: any, index: number) => {
      // Handle potential array or single object return depending on join configuration
      const profile = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
      return {
        id: record.user_id,
        user_id: record.user_id,
        full_name: profile?.full_name || profile?.display_name || "Alumni Member",
        avatar_url: profile?.avatar_url || profile?.photo_url,
        campus: profile?.campus,
        graduation_year: profile?.graduation_year,
        points: record.total_points || 0,
        rank: index + 1,
      }
    })

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error("[Leaderboard API] Unexpected Error:", error)
    return NextResponse.json({ leaderboard: [] }, { status: 500 })
  }
}
