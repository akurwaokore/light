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

    const { status, rejection_reason } = await request.json()
    const allowedStatuses = [
      "pending", "reviewed", "shortlisted", "interview_scheduled", "interviewed",
      "offer_extended", "offer_accepted", "offer_declined", "hired", "rejected",
    ]

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
      .update({
        status,
        rejection_reason: status === "rejected" ? (rejection_reason || null) : null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", appId)
      .select("id, user_id, job_id, status")
      .single()

    if (error) throw error

    const messages: Record<string, string> = {
      reviewed: "Your application has been reviewed.",
      shortlisted: "Great news — you've been shortlisted!",
      interview_scheduled: "You've been invited to an interview. Check the details.",
      interviewed: "Your interview has been marked complete.",
      offer_extended: "You've received an offer! Review the terms.",
      hired: "Congratulations — you've been hired!",
      rejected: rejection_reason
        ? `Your application was not successful. ${rejection_reason}`
        : "Your application was not successful this time.",
    }
    // Award the applicant loyalty points when they land the job.
    if (status === "hired") {
      await supabase.rpc("award_points", {
        p_user_id: data.user_id,
        p_points: 25,
        p_type: "earn",
        p_reason: "Hired for a job",
        p_reference_id: appId,
        p_reference_type: "application",
        p_metadata: {},
      })
    }

    await supabase.from("notifications").insert({
      user_id: data.user_id,
      type: "application_update",
      title: "Application status updated",
      message: messages[status] || `Your application status is now ${status}.`,
      action_url: `/careers/my-applications/${appId}`,
      metadata: { applicationId: appId, jobId: data.job_id, status },
    })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
