import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const { authorized, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const admin = createAdminClient()
  const { data: jobs, error } = await admin
    .from("jobs").select("*").order("created_at", { ascending: false })
  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(jobs)
}

export async function POST(request: Request) {
  const { authorized, status, user } = (await checkAdminAccess()) as any
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("jobs")
    .insert([{ ...body, posted_by: body.posted_by || user?.id, status: body.status || "active" }])
    .select()
    .single()
  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

// Bulk moderation: { ids: string[], status } or { approveAll: true }
export async function PATCH(request: Request) {
  const { authorized, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()
  const newStatus = body.status || "active"
  const admin = createAdminClient()

  let query = admin.from("jobs").update({ status: newStatus, updated_at: new Date().toISOString() })

  if (body.approveAll) {
    query = query.eq("status", "pending_approval")
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    query = query.in("id", body.ids)
  } else {
    return new NextResponse("Provide ids[] or approveAll", { status: 400 })
  }

  const { data, error } = await query.select("id, posted_by, title, status")
  if (error) return new NextResponse(error.message, { status: 500 })

  if (newStatus === "active" && data) {
    for (const job of data) {
      await admin.from("notifications").insert({
        user_id: job.posted_by,
        type: "job_approved",
        title: "Job approved",
        message: `Your job "${job.title}" is now live.`,
        action_url: "/careers/my-listings",
        metadata: { jobId: job.id },
      })
    }
  }

  return NextResponse.json({ updated: data?.length || 0, jobs: data })
}
