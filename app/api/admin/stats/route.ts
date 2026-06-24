import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // 1. Total members
    const { count: totalMembers } = await supabase
      .from("profiles").select("*", { count: "exact", head: true })

    // 2. Active events (live events use approved/active/upcoming)
    const { count: activeEvents } = await supabase
      .from("events").select("*", { count: "exact", head: true })
      .in("status", ["approved", "active", "upcoming"])

    // 3. Pending approvals — jobs live in `jobs` (not job_listings)
    const { count: pendingJobs } = await supabase
      .from("jobs").select("*", { count: "exact", head: true }).eq("status", "pending_approval")
    const { count: pendingProducts } = await supabase
      .from("products").select("*", { count: "exact", head: true }).eq("status", "pending_approval")
    const { count: pendingEvents } = await supabase
      .from("events").select("*", { count: "exact", head: true }).eq("status", "pending_approval")

    // 4. Recent members
    const { data: recentMembers } = await supabase
      .from("profiles").select("id, display_name, email, graduation_year, created_at, points")
      .order("created_at", { ascending: false }).limit(5)

    // 5. Points aggregates (profiles.points is the source behind user_points view)
    const { data: pointsRows } = await supabase.from("profiles").select("points")
    const pointVals = (pointsRows || []).map((r: any) => Number(r.points || 0))
    const totalPoints = pointVals.reduce((s, v) => s + v, 0)
    const participants = pointVals.filter((v) => v > 0).length
    const avgPoints = participants ? totalPoints / participants : 0

    // 6. Donations total (defensive — table/column may vary)
    let totalDonations = 0
    try {
      const { data: donations } = await supabase.from("donations").select("amount, status")
      totalDonations = (donations || [])
        .filter((d: any) => !d.status || ["completed", "succeeded", "paid", "success"].includes(d.status))
        .reduce((s: number, d: any) => s + Number(d.amount || 0), 0)
    } catch { totalDonations = 0 }

    // 7. Distribution + growth (RPCs; empty if absent)
    const { data: distributionData } = await supabase.rpc("get_member_distribution")
    const { data: growthData } = await supabase.rpc("get_member_growth")

    // 8. Pending moderation items (jobs from `jobs`)
    const { data: recentJobs } = await supabase
      .from("jobs").select("id, title, created_at").eq("status", "pending_approval").limit(2)
    const { data: recentProducts } = await supabase
      .from("products").select(`id, title, created_at, seller:profiles(display_name)`).eq("status", "pending_approval").limit(2)
    const { data: recentEvents } = await supabase
      .from("events").select(`id, title, created_at, organizer:profiles!events_organizer_id_fkey(display_name)`).eq("status", "pending_approval").limit(2)

    const pendingList = [
      ...(recentJobs || []).map((j: any) => ({ ...j, type: "Job Posting", by: "Member", link: "/admin/jobs" })),
      ...(recentProducts || []).map((p: any) => ({ ...p, type: "Marketplace", by: p.seller?.display_name || "Seller", link: "/admin/marketplace" })),
      ...(recentEvents || []).map((e: any) => ({ ...e, type: "Event", by: e.organizer?.display_name || "Organizer", link: "/admin/events" })),
    ]

    return NextResponse.json({
      totalMembers: totalMembers || 0,
      activeEvents: activeEvents || 0,
      totalDonations,
      totalPoints,
      avgPoints: Number(avgPoints.toFixed(2)),
      participants,
      pendingApprovals: (pendingJobs || 0) + (pendingProducts || 0) + (pendingEvents || 0),
      recentMembers: recentMembers || [],
      memberDistribution: distributionData || [],
      memberGrowth: growthData || [],
      pendingList,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
