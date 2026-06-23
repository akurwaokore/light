import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { normalizeJobApplication } from "@/lib/jobs"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Fetch applications for the current user
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        *,
        job:jobs (
          id,
          title,
          company,
          location,
          logo_url,
          employment_type,
          currency,
          salary_min,
          salary_max,
          description
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ applications: (data || []).map(normalizeJobApplication) })
  } catch (error: any) {
    console.error("[My Applications API] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
