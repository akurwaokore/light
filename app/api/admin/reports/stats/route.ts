import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // 1. Core Counts
    const { count: activeMembers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active")
    const { data: donations } = await supabase.from("donation_campaigns").select("current_amount")
    const totalDonations = donations?.reduce((sum, d) => sum + (d.current_amount || 0), 0) || 0

    // 2. Attendance (RSVP vs Total possible)
    const { count: totalRsvps } = await supabase.from("event_registrations").select("*", { count: "exact", head: true })

    // 3. Marketplace Sales
    const { data: sales } = await supabase.from("products").select("price").eq("status", "sold")
    const totalSales = sales?.reduce((sum, p) => sum + (p.price || 0), 0) || 0

    // 4. Campus Distribution
    const { data: campuses } = await supabase.rpc("get_campus_distribution")

    // 5. Monthly Growth
    const { data: growth } = await supabase.rpc("get_member_growth")

    return NextResponse.json({
      activeMembers: activeMembers || 0,
      totalRevenue: totalDonations + totalSales,
      eventAttendance: totalRsvps || 0,
      marketplaceSales: totalSales,
      campusDistribution: campuses || [],
      memberGrowth: growth || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
