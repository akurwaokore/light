import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const update: Record<string, any> = {}

  // "Send" marks the newsletter sent and stamps recipients from the active
  // subscriber list. (Actual email delivery requires an email provider, which
  // is not yet configured — this transitions the record's state.)
  if (body.action === "send") {
    const { count } = await supabase!
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    update.status = "sent"
    update.sent_at = new Date().toISOString()
    update.recipients = count || 0
  } else {
    if (body.title !== undefined) update.title = body.title
    if (body.subject !== undefined) update.subject = body.subject
    if (body.content !== undefined) update.content = body.content
    if (body.status !== undefined) update.status = body.status
  }

  const { data, error } = await supabase!
    .from("newsletters")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { id } = await params

  const { error } = await supabase!.from("newsletters").delete().eq("id", id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
