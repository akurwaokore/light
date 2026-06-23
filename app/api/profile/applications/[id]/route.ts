import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { status } = await request.json()
    const allowedStatuses = ["pending", "reviewed", "shortlisted", "rejected", "hired"]

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid application status" }, { status: 400 })
    }

    // Update application if job belongs to current user
    // We check if the application's job.posted_by is the current user
    const { data: appData, error: fetchError } = await supabase
      .from("job_applications")
      .select(`
        id,
        job:jobs(posted_by)
      `)
      .eq("id", appId)
      .single()

    const job = Array.isArray(appData?.job) ? appData.job[0] : appData?.job

    if (fetchError || !appData || job?.posted_by !== user.id) {
       return NextResponse.json({ error: "Unauthorized to update this application" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("job_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", appId)
      .select("id, user_id, job_id, status")
      .single()

    if (error) throw error

    await supabase.from("notifications").insert({
      user_id: data.user_id,
      type: "application_submitted",
      title: "Application Status Updated",
      message: `Your application status is now ${status}.`,
      action_url: `/careers/my-applications/${appId}`,
      metadata: { applicationId: appId, jobId: data.job_id, status },
    })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
