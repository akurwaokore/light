import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { normalizeJobApplication } from "@/lib/jobs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("posted_by", user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 })
    }

    // Fetch applications
    const { data: applications, error: appError } = await supabase
      .from("job_applications")
      .select(`
        *,
        applicant:profiles(id, display_name, email, photo_url, full_name, bio)
      `)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })

    if (appError) throw appError

    return NextResponse.json({ job, applications: (applications || []).map(normalizeJobApplication) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
