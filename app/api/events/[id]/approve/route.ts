import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST - Approve or reject event
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can approve events" }, { status: 403 })
    }

    const body = await request.json()
    const { action, rejection_reason } = body

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updateData =
      action === "approve"
        ? {
            status: "approved",
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            rejection_reason: null,
          }
        : {
            status: "rejected",
            rejection_reason: rejection_reason || "No reason provided",
          }

    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(id, display_name, email, photo_url)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
