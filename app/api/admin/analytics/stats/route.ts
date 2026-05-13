import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // 1. Total Members (Active Users)
    const { count: activeUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    // 2. Event RSVPs
    const { count: rsvps } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })

    // 3. Donation Total (Simulated for now until donations table is fully confirmed)
    // In a real scenario, we would sum the 'amount' column of a 'donations' table
    // const { data: donations } = await supabase.from("donations").select("amount")
    // const totalDonations = donations?.reduce((sum, d) => sum + d.amount, 0) || 0

    return NextResponse.json({
      activeUsers: activeUsers || 0,
      eventRSVPs: rsvps || 0,
      pageViews: 0, // Would require a page_views tracking table
      totalDonations: 0,
      // More detailed time-series data could be added here for the charts
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
