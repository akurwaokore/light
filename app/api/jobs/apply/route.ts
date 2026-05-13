import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    // 2. Fetch applicant CV details if cvId is provided, otherwise fallback to cvUrl
    let finalCvUrl = cvUrl
    if (cvId && cvId !== "placeholder") {
      const { data: cvData } = await supabase
        .from("cvs")
        .select("file_url")
        .eq("id", cvId)
        .single()
      if (cvData) finalCvUrl = cvData.file_url
    }

    if (!finalCvUrl) {
      // Last fallback check for user's primary CV
      const { data: userCv } = await supabase
        .from("cvs")
        .select("file_url")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      finalCvUrl = userCv?.file_url || "pending"
    }

    // 3. Submit application
    console.log("[Job Apply] Attempting to insert application:", { jobId, userId: user.id, cv_url: finalCvUrl })
    const defaultCoverLetter = coverLetter || "I am interested in this position."

    const payloads = [
      {
        job_id: jobId,
        user_id: user.id,
        cv_url: finalCvUrl,
        cover_letter: defaultCoverLetter,
        status: "pending",
      },
      {
        job_id: jobId,
        user_id: user.id,
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

    return NextResponse.json({ success: true, data: application, warnings })
  } catch (error: any) {
    console.error("[Job Apply] error:", error)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
