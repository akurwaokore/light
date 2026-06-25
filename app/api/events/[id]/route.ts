import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { checkAdminAccess } from "@/lib/admin-auth"
import { EVENT_SELECT, normalizeEvent } from "../route"

function toTimestamp(dateStr?: string | null, timeStr?: string | null, iso?: string | null): string | null {
  if (iso) {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  if (!dateStr) return null
  const d = new Date(`${dateStr}T${timeStr || "00:00"}`)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

// GET - Fetch single event
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const { data, error } = await supabase.from("events").select(EVENT_SELECT).eq("id", id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(normalizeEvent(data))
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

    const { data: event } = await supabase.from("events").select("organizer_id").eq("id", id).single()

    const isOwner = event?.organizer_id === user.id
    const isAdmin = isOwner ? false : (await checkAdminAccess("manage_events")).authorized

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Translate the form's field names to the live events schema.
    const startAt = toTimestamp(body.date, body.time, body.start_at)
    const endAt = toTimestamp(body.date, body.end_time, body.end_at)
    const price = body.is_free ? 0 : Number(body.ticket_price ?? body.price ?? 0) || 0
    const capacityRaw = body.max_attendees ?? body.capacity
    const capacity = capacityRaw ? Number.parseInt(String(capacityRaw)) : null

    const updateData: Record<string, any> = {
      title: body.title,
      description: body.description,
      event_type: body.category || body.event_type,
      location: body.location ?? null,
      is_virtual: body.is_virtual ?? false,
      meeting_url: body.google_meet_link || body.meeting_link || body.meeting_url || null,
      capacity,
      ticket_price: price,
      image_url: body.image_url,
      updated_at: new Date().toISOString(),
    }
    if (startAt) updateData.start_at = startAt
    if (endAt !== null) updateData.end_at = endAt

    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select(EVENT_SELECT)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(normalizeEvent(data))
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
