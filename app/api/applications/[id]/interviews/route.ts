import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - interviews for an application (RLS: party only).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("interviews").select("*").eq("application_id", id).order("scheduled_at", { ascending: true })
    if (error) throw error
    return NextResponse.json({ interviews: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - poster schedules an interview { scheduled_at, mode, duration_min, location, meeting_link, notes }.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only the poster may schedule.
    const { data: app } = await supabase
      .from("job_applications").select("id, user_id, job_id, job:jobs(posted_by, title)").eq("id", id).single()
    const job: any = Array.isArray(app?.job) ? app?.job[0] : app?.job
    if (!app || job?.posted_by !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    if (!body.scheduled_at) return NextResponse.json({ error: "scheduled_at required" }, { status: 400 })

    const { data: interview, error } = await supabase
      .from("interviews")
      .insert({
        application_id: id,
        scheduled_at: body.scheduled_at,
        duration_min: body.duration_min ?? 30,
        mode: body.mode ?? "video",
        location: body.location ?? null,
        meeting_link: body.meeting_link ?? null,
        notes: body.notes ?? null,
        created_by: user.id,
      })
      .select()
      .single()
    if (error) throw error

    await supabase.from("job_applications").update({ status: "interview_scheduled", updated_at: new Date().toISOString() }).eq("id", id)
    await supabase.from("notifications").insert({
      user_id: app.user_id,
      type: "application_update",
      title: "Interview scheduled",
      message: `You have an interview for "${job?.title || "a role"}".`,
      action_url: `/careers/my-applications/${id}`,
      metadata: { applicationId: id, interviewId: interview.id },
    })
    return NextResponse.json({ interview })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
