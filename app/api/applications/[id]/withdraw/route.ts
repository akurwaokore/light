import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST - applicant withdraws their own application.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: app } = await supabase
      .from("job_applications")
      .select("id, user_id, job_id, job:jobs(posted_by, title)")
      .eq("id", id)
      .single()
    if (!app || app.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let { error } = await supabase
      .from("job_applications")
      .update({ status: "withdrawn", withdrawn_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
    // Tolerate databases that haven't added withdrawn_at yet (PostgREST PGRST204
    // / Postgres 42703): retry without it so withdrawal still works.
    if (error && (error.code === "PGRST204" || error.code === "42703")) {
      ;({ error } = await supabase
        .from("job_applications")
        .update({ status: "withdrawn", updated_at: new Date().toISOString() })
        .eq("id", id))
    }
    if (error) throw error

    const job: any = Array.isArray(app.job) ? app.job[0] : app.job
    if (job?.posted_by) {
      await supabase.from("notifications").insert({
        user_id: job.posted_by,
        type: "application_update",
        title: "Application withdrawn",
        message: `An applicant withdrew from "${job.title || "your job"}".`,
        action_url: `/careers/my-listings/${app.job_id}`,
        metadata: { applicationId: id },
      })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
