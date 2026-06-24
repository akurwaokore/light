import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - offers for an application (RLS: party only).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { data, error } = await supabase.from("offers").select("*").eq("application_id", id).order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ offers: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - poster extends an offer { salary_amount, currency, terms, start_date, expires_at }.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: app } = await supabase
      .from("job_applications").select("id, user_id, job:jobs(posted_by, title)").eq("id", id).single()
    const job: any = Array.isArray(app?.job) ? app?.job[0] : app?.job
    if (!app || job?.posted_by !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { data: offer, error } = await supabase
      .from("offers")
      .insert({
        application_id: id,
        salary_amount: body.salary_amount ?? null,
        currency: body.currency ?? "KES",
        terms: body.terms ?? null,
        start_date: body.start_date ?? null,
        expires_at: body.expires_at ?? null,
        created_by: user.id,
      })
      .select()
      .single()
    if (error) throw error

    await supabase.from("job_applications").update({ status: "offer_extended", updated_at: new Date().toISOString() }).eq("id", id)
    await supabase.from("notifications").insert({
      user_id: app.user_id,
      type: "application_update",
      title: "You received an offer",
      message: `You've been extended an offer for "${job?.title || "a role"}".`,
      action_url: `/careers/my-applications/${id}`,
      metadata: { applicationId: id, offerId: offer.id },
    })
    return NextResponse.json({ offer })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - applicant responds { offerId, action: 'accept' | 'decline' }.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: app } = await supabase
      .from("job_applications").select("id, user_id, job:jobs(posted_by, title)").eq("id", id).single()
    if (!app || app.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { offerId, action } = await request.json()
    if (!["accept", "decline"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    const offerStatus = action === "accept" ? "accepted" : "declined"
    const appStatus = action === "accept" ? "offer_accepted" : "offer_declined"
    await supabase.from("offers").update({ status: offerStatus, responded_at: new Date().toISOString() }).eq("id", offerId).eq("application_id", id)
    await supabase.from("job_applications").update({ status: appStatus, updated_at: new Date().toISOString() }).eq("id", id)

    const job: any = Array.isArray(app?.job) ? app?.job[0] : app?.job
    if (job?.posted_by) {
      await supabase.from("notifications").insert({
        user_id: job.posted_by,
        type: "application_update",
        title: `Offer ${offerStatus}`,
        message: `An applicant ${offerStatus} your offer.`,
        action_url: `/careers/my-listings`,
        metadata: { applicationId: id, offerId },
      })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
