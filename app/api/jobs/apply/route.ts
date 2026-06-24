import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { normalizeJobApplication } from "@/lib/jobs"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const warnings: string[] = []

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId, cvId, cvUrl, coverLetter } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 })
    }

    // 1. Fetch job and poster details
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("title, posted_by")
      .eq("id", jobId)
      .single()

    if (jobError || !jobData) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (jobData.posted_by === user.id) {
      return NextResponse.json({ error: "You cannot apply to your own job posting" }, { status: 400 })
    }

    const { data: existingApplication } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this job", applicationId: existingApplication.id },
        { status: 409 },
      )
    }

    // 2. Resolve which CV to attach. Prefer an explicit cvId; else the user's
    // primary/newest CV. Store cv_id so the poster can fetch a signed URL.
    let finalCvId: string | null = cvId && cvId !== "placeholder" ? cvId : null
    let finalCvUrl = cvUrl || null
    if (finalCvId) {
      const { data: cvData } = await supabase.from("cvs").select("id, file_url").eq("id", finalCvId).single()
      if (cvData) finalCvUrl = cvData.file_url || finalCvUrl
    } else {
      const { data: userCv } = await supabase
        .from("cvs")
        .select("id, file_url")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (userCv) {
        finalCvId = userCv.id
        finalCvUrl = userCv.file_url || finalCvUrl
      }
    }

    // 3. Submit application
    const defaultCoverLetter = coverLetter || "I am interested in this position."

    const payloads = [
      {
        job_id: jobId,
        user_id: user.id,
        cv_id: finalCvId,
        cv_url: finalCvUrl,
        cover_letter: defaultCoverLetter,
        status: "pending",
      },
      {
        job_id: jobId,
        user_id: user.id,
        cv_id: finalCvId,
        cover_letter: defaultCoverLetter,
        status: "pending",
      },
    ]

    let application: any = null
    let applyError: any = null

    for (const payload of payloads) {
      const result = await supabase
        .from("job_applications")
        .insert([payload as any])
        .select()
        .maybeSingle()

      application = result.data
      applyError = result.error

      if (!applyError && application) {
        break
      }
    }

    if (applyError) {
      console.error("[Job Apply] All insert attempts failed:", applyError)
      return NextResponse.json(
        {
          error: "Failed to submit application",
          details: applyError.message || "Database insert failed",
          code: applyError.code || null,
        },
        { status: 500 }
      )
    }

    if (!application) {
      console.error("[Job Apply] No data returned after insertion")
      return NextResponse.json({ error: "Failed to create application record" }, { status: 500 })
    }

    // 4. Send notification to job poster
    const applicantName = user.user_metadata?.full_name || user.email || "An alumni"
    
    const { error: posterNotifError } = await supabase.from("notifications").insert({
      user_id: jobData.posted_by,
      type: "job_application",
      title: "New Job Application!",
      message: `${applicantName} has applied for your job posting: ${jobData.title}.`,
      action_url: `/profile/listings/jobs/${jobId}/applications`,
      metadata: {
        jobId,
        applicationId: application.id,
        applicantId: user.id
      }
    })

    if (posterNotifError) {
      console.error("[Job Apply] poster notification insert failed:", posterNotifError)
      warnings.push("Could not notify job poster")
    }

    // 5. Send confirmation notification to applicant
    const { error: applicantNotifError } = await supabase.from("notifications").insert({
      user_id: user.id,
      type: "application_submitted",
      title: "Application Sent",
      message: `Your application for ${jobData.title} has been successfully submitted.`,
      action_url: `/careers/my-applications/${application.id}`,
      metadata: { jobId, applicationId: application.id }
    })

    if (applicantNotifError) {
      console.error("[Job Apply] applicant notification insert failed:", applicantNotifError)
      warnings.push("Could not create applicant confirmation notification")
    }

    return NextResponse.json({ success: true, data: normalizeJobApplication(application), warnings })
  } catch (error: any) {
    console.error("[Job Apply] error:", error)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
