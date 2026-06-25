import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

// Real points dashboard stats for /admin/points. Computed from profiles.points
// (the loyalty balance) + points_transactions (activity), not stubbed zeros.
export async function GET() {
  try {
    const { authorized, status } = await checkAdminAccess()
    if (!authorized) return unauthorizedResponse(status!)
    const admin = createAdminClient()

    const { data: profilesRaw } = await admin
      .from("profiles")
      .select("id, display_name, photo_url, points, points_rank")
    const profiles = (profilesRaw || []).map((p: any) => ({ ...p, points: Number(p.points) || 0 }))

    const totalUsers = profiles.length
    const participants = profiles.filter((p) => p.points > 0)
    const totalPoints = profiles.reduce((s, p) => s + p.points, 0)
    const averagePoints = participants.length ? totalPoints / participants.length : 0

    // Exclusive milestone bands (a 1000-pt user counts only in 100%, not all).
    const milestones = {
      "25%": profiles.filter((p) => p.points >= 250 && p.points < 500).length,
      "50%": profiles.filter((p) => p.points >= 500 && p.points < 750).length,
      "75%": profiles.filter((p) => p.points >= 750 && p.points < 1000).length,
      "100%": profiles.filter((p) => p.points >= 1000).length,
    }

    const topUsers = [...profiles]
      .sort((a, b) => b.points - a.points)
      .slice(0, 8)
      .map((p, i) => ({ ...p, points_rank: p.points_rank || i + 1 }))

    // Growth: total points earned this week vs the previous week.
    const { data: tx } = await admin
      .from("points_transactions")
      .select("id, type, points, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(1000)
    const now = Date.now()
    const week = 7 * 24 * 60 * 60 * 1000
    const sumWindow = (lo: number, hi: number) =>
      (tx || [])
        .filter((t: any) => {
          const age = now - new Date(t.created_at).getTime()
          return age > lo && age <= hi
        })
        .reduce((s: number, t: any) => s + Math.abs(Number(t.points) || 0), 0)
    const thisWeek = sumWindow(-1, week)
    const prevWeek = sumWindow(week, 2 * week)
    const growthRate = prevWeek > 0 ? ((thisWeek - prevWeek) / prevWeek) * 100 : thisWeek > 0 ? 100 : 0

    return NextResponse.json({
      totalUsers,
      totalPoints,
      averagePoints,
      growthRate,
      milestones,
      topUsers,
      recentActivity: (tx || []).slice(0, 10),
    })
  } catch (error) {
    console.error("[points stats] error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
