import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    let userId = searchParams.get("userId")

    // If no userId provided, try to get the currently authenticated user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
      } else {
        return NextResponse.json({ points: 0, rank: null, milestone: 0 })
      }
    }

    // Fetch from user_points table
    const { data: pointsData, error } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error("[Points API] Error fetching points:", error)
      return NextResponse.json({ points: 0, rank: null, milestone: 0 }, { status: 500 })
    }

    const points = pointsData?.total_points || 0
    
    // Calculate milestone (next 100)
    const milestone = Math.ceil((points + 1) / 100) * 100

    return NextResponse.json({
      points,
      rank: null, // Rank requires a complex query, skipping for now
      milestone,
    })
  } catch (error) {
    console.error("[Points API] Unexpected error:", error)
    return NextResponse.json(
      {
        points: 0,
        rank: null,
        milestone: 0,
      },
      { status: 500 },
    )
  }
}
