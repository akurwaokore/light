import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // 1. Total Members
    const { count: totalMembers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    // 2. Active Events
    const { count: activeEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "upcoming")

    // 3. Pending Approvals
    const { count: pendingJobs } = await supabase
      .from("job_listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_approval")

    const { count: pendingProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_approval")

    const { count: pendingEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_approval")

    // 4. Recent Members
    const { data: recentMembers } = await supabase
      .from("profiles")
      .select("id, display_name, email, graduation_year, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    // 5. Member Distribution (by Graduation Year)
    const { data: distributionData } = await supabase.rpc("get_member_distribution")

    // 6. Member Growth (Monthly for the current year)
    const { data: growthData } = await supabase.rpc("get_member_growth")

    // 7. Recent Items for Moderation
    const { data: recentJobs } = await supabase
      .from("job_listings")
      .select("id, title, poster_name, created_at")
      .eq("status", "pending_approval")
      .limit(2)

    const { data: recentProducts } = await supabase
      .from("products")
      .select(`
        id, 
        title, 
        created_at,
        seller:profiles(display_name)
      `)
      .eq("status", "pending_approval")
      .limit(2)

    const { data: recentEvents } = await supabase
      .from("events")
      .select(`
        id, 
        title, 
        created_at,
        organizer:profiles!events_organizer_id_fkey(display_name)
      `)
      .eq("status", "pending_approval")
      .limit(2)

    const pendingList = [
      ...(recentJobs || []).map((j) => ({ 
        ...j, 
        type: "Job Posting", 
        by: j.poster_name || "Member", 
        link: "/admin/jobs" 
      })),
      ...(recentProducts || []).map((p: any) => ({ 
        ...p, 
        type: "Marketplace", 
        by: p.seller?.display_name || "Seller", 
        link: "/admin/marketplace" 
      })),
      ...(recentEvents || []).map((e: any) => ({ 
        ...e, 
        type: "Event", 
        by: e.organizer?.display_name || "Organizer", 
        link: "/admin/events" 
      })),
    ]

    return NextResponse.json({
      totalMembers: totalMembers || 0,
      activeEvents: activeEvents || 0,
      pendingApprovals: (pendingJobs || 0) + (pendingProducts || 0) + (pendingEvents || 0),
      recentMembers: recentMembers || [],
      memberDistribution: distributionData || [],
      memberGrowth: growthData || [],
      pendingList: pendingList
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
