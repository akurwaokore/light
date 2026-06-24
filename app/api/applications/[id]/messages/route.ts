import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - thread for an application. RLS limits to applicant/poster/admin —
// friendship-INDEPENDENT (recruiting messaging is separate from social DMs).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("application_messages")
      .select("id, sender_id, content, created_at, read_at")
      .eq("application_id", id)
      .order("created_at", { ascending: true })
    if (error) throw error

    const messages = (data || []).map((m) => ({ ...m, mine: m.sender_id === user.id }))
    return NextResponse.json({ messages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - send a message { content }.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { content } = await request.json()
    if (!content || !content.trim()) return NextResponse.json({ error: "Message is empty" }, { status: 400 })

    const { data: msg, error } = await supabase
      .from("application_messages")
      .insert({ application_id: id, sender_id: user.id, content: content.trim() })
      .select("id, sender_id, content, created_at")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 403 })

    // Notify the other party.
    const { data: app } = await supabase
      .from("job_applications").select("user_id, job:jobs(posted_by)").eq("id", id).single()
    const job: any = Array.isArray(app?.job) ? app?.job[0] : app?.job
    const recipient = user.id === app?.user_id ? job?.posted_by : app?.user_id
    if (recipient) {
      await supabase.from("notifications").insert({
        user_id: recipient,
        type: "application_message",
        title: "New message",
        message: "You have a new message about a job application.",
        action_url: `/careers/my-applications/${id}`,
        metadata: { applicationId: id },
      })
    }
    return NextResponse.json({ message: { ...msg, mine: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
