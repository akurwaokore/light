import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

// Use the service-role client for writes (after verifying admin) so RLS on the
// jobs table can never block a legitimate admin approval/edit.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()
  const { id } = await params
  const admin = createAdminClient()

  const { data: job, error } = await admin
    .from("jobs")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  // Notify the poster when their job is approved/activated.
  if ((body.status === "active" || body.status === "approved") && job?.posted_by) {
    await admin.from("notifications").insert({
      user_id: job.posted_by,
      type: "job_approved",
      title: "Job approved",
      message: `Your job "${job.title}" is now live.`,
      action_url: "/careers/my-listings",
      metadata: { jobId: job.id },
    })
  }

  return NextResponse.json(job)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = await params
  const admin = createAdminClient()

  const { error } = await admin.from("jobs").delete().eq("id", id)
  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
