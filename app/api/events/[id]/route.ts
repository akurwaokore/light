import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { checkAdminAccess } from "@/lib/admin-auth"

// GET - Fetch single event
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(id, display_name, photo_url)
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

    // Check if user owns the event or is admin. `user_roles` has no `role`
    // column (role names live behind the roles relation), so adminness is
    // resolved via the centralized RBAC helper instead of a direct query.
    const { data: event } = await supabase.from("events").select("organizer_id").eq("id", id).single()

    const isOwner = event?.organizer_id === user.id
    const isAdmin = isOwner ? false : (await checkAdminAccess("manage_events")).authorized

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Column names must match the events table schema (date/time/end_time/
    // category/google_meet_link/ticket_price), not the previous invented ones
    // (start_date/event_type/meeting_link/price/venue_address) which made every
    // update fail against Postgres.
    const updateData: Record<string, any> = {
      title: body.title,
      description: body.description,
      date: body.date,
      time: body.time,
      end_time: body.end_time || null,
      location: body.location,
      is_virtual: body.is_virtual ?? false,
      google_meet_link: body.google_meet_link || null,
      category: body.category,
      max_attendees: body.max_attendees ? Number.parseInt(body.max_attendees) : null,
      image_url: body.image_url,
      registration_deadline: body.registration_deadline || null,
      ticket_price: body.is_free ? 0 : body.ticket_price || 0,
      is_free: body.is_free ?? false,
      updated_at: new Date().toISOString(),
      // If a non-admin owner edits their event, send it back for re-approval.
      ...(isOwner && !isAdmin ? { status: "pending_approval" } : {}),
    }

    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(id, display_name, photo_url)
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

    // Check if admin. `profiles` has no `role` column (roles live in user_roles
    // and the is_admin flag), so use the centralized RBAC helper. Event owners
    // may also delete their own event.
    const { data: event } = await supabase.from("events").select("organizer_id").eq("id", id).single()
    const isOwner = event?.organizer_id === user.id

    if (!isOwner) {
      const admin = await checkAdminAccess()
      if (!admin.authorized) {
        return NextResponse.json({ error: "Only the organizer or an admin can delete this event" }, { status: 403 })
      }
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
