import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership of the job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("posted_by")
      .eq("id", id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (job.posted_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch applications for this job with applicant profiles
    const { data: applications, error: applicationsError } = await supabase
      .from("job_applications")
      .select(`
        *,
        applicant:profiles(id, display_name, photo_url, email, full_name, bio)
      `)
      .eq("job_id", id)
      .order("created_at", { ascending: false })

    if (applicationsError) {
      console.error("[Job Applications API] error:", applicationsError)
      return NextResponse.json({ error: applicationsError.message }, { status: 500 })
    }

    return NextResponse.json(applications)
  } catch (error) {
    console.error("[Job Applications API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
