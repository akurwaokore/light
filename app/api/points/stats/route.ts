import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get total user count from profiles (without points filter)
    const { count: totalUsers } = await supabase.from("profiles").select("id", { count: "exact", head: true })

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalPoints: 0,
      averagePoints: 0,
      growthRate: 0,
      milestones: {
        "25%": 0,
        "50%": 0,
        "75%": 0,
        "100%": 0,
      },
      topUsers: [],
      recentActivity: [],
      message: "Points system not yet configured. Run the points migration script to enable this feature.",
    })
  } catch (error) {
    console.error("[akurwas] Error fetching points stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
