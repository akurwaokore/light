import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Points/rank are always scoped to the authenticated user. A client-supplied
    // userId is ignored to prevent reading other users' data.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ points: 0, rank: null, milestone: 0 }, { status: 401 })
    }
    const userId = user.id

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
    
    // Calculate rank with a lightweight count query.
    const { count: rankCount } = await supabase
      .from("user_points")
      .select("*", { count: "exact", head: true })
      .gt("total_points", points)

    // Calculate milestone (next 100)
    const milestone = Math.ceil((points + 1) / 100) * 100

    return NextResponse.json({
      points,
      rank: typeof rankCount === "number" ? rankCount + 1 : null,
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
