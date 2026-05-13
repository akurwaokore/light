import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch single event
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(id, display_name, email, photo_url)
      `)
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update event
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json()

    // Check if user owns the event or is admin
    const { data: event } = await supabase.from("events").select("organizer_id").eq("id", id).single()

    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()

    const isAdmin = roleData?.role === "admin" || roleData?.role === "super_admin"
    const isOwner = event?.organizer_id === user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData = {
      title: body.title,
      description: body.description,
      start_date: body.date ? new Date(body.date + "T" + body.time).toISOString() : undefined,
      end_date: body.end_time ? new Date(body.date + "T" + body.end_time).toISOString() : null,
      location: body.location,
      is_virtual: body.is_virtual,
      meeting_link: body.google_meet_link,
      event_type: body.category,
      max_attendees: body.max_attendees ? Number.parseInt(body.max_attendees) : null,
      image_url: body.image_url,
      registration_deadline: body.registration_deadline,
      price: body.is_free ? 0 : body.ticket_price || 0,
      venue_address: !body.is_virtual ? body.location : null,
      updated_at: new Date().toISOString(),
      // If user edits their event, reset to pending approval (unless admin)
      ...(isOwner && !isAdmin ? { status: "pending_approval" } : {}),
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

// DELETE - Delete event
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: "Only admins can delete events" }, { status: 403 })
    }

    const { error } = await supabase.from("events").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
