import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch jobs posted by the user, including application counts
    const { data: listings, error } = await supabase
      .from("jobs")
      .select(`
        *,
        applications:job_applications(count)
      `)
      .eq("posted_by", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[My Listings API] error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Flatten application counts
    const listingsWithCounts = listings.map(job => ({
      ...job,
      application_count: job.applications?.[0]?.count || 0
    }))

    return NextResponse.json(listingsWithCounts)
  } catch (error) {
    console.error("[My Listings API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
