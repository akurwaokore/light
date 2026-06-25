import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// The live `events` table is the canonical schema:
//   start_at / end_at / event_type / meeting_url / capacity /
//   registrations_count / ticket_price / is_virtual / is_public / status /
//   organizer_id.
// The UI was written against older invented names (start_date/event_type/
// meeting_link/price/max_attendees). We normalize on read so the existing
// pages work unchanged, and translate on write so the existing event form
// works unchanged.

export const EVENT_SELECT = `
  id, title, description, event_type, start_at, end_at, location, is_virtual,
  meeting_url, capacity, is_public, ticket_price, image_url, registrations_count,
  organizer_id, status, created_at, updated_at,
  organizer:profiles!events_organizer_id_fkey(id, display_name, photo_url)
`

export function normalizeEvent(e: any) {
  if (!e) return e
  const price = Number(e.ticket_price) || 0
  return {
    ...e,
    // canonical (kept) + UI-friendly aliases
    start_date: e.start_at,
    end_date: e.end_at,
    date: e.start_at ? String(e.start_at).slice(0, 10) : null,
    time: e.start_at ? new Date(e.start_at).toISOString().slice(11, 16) : null,
    meeting_link: e.meeting_url,
    google_meet_link: e.meeting_url,
    category: e.event_type,
    price,
    ticket_price: price,
    is_free: !(price > 0),
    max_attendees: e.capacity,
    registered_count: e.registrations_count ?? 0,
  }
}

// Build a timestamptz from a date (YYYY-MM-DD) + time (HH:MM) pair, falling
// back to a direct ISO string if one was supplied.
function toTimestamp(dateStr?: string | null, timeStr?: string | null, iso?: string | null): string | null {
  if (iso) {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  if (!dateStr) return null
  const d = new Date(`${dateStr}T${timeStr || "00:00"}`)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

// GET - Fetch events (with filters)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const organizer_id = searchParams.get("organizer_id")
    const pending_only = searchParams.get("pending_only") === "true"

    let query = supabase.from("events").select(EVENT_SELECT).order("start_at", { ascending: true })

    if (status) query = query.eq("status", status)
    if (category) query = query.eq("event_type", category)
    if (organizer_id) query = query.eq("organizer_id", organizer_id)
    if (pending_only) query = query.eq("status", "pending_approval")

    const { data: events, error } = await query

    if (error) {
      console.error("[events] fetch error:", error.message)
      return NextResponse.json([])
    }

    return NextResponse.json((events || []).map(normalizeEvent))
  } catch (error: any) {
    console.error("[events] fetch error:", error.message)
    return NextResponse.json([])
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const startAt = toTimestamp(body.date, body.time, body.start_at)
    if (!startAt) {
      return NextResponse.json({ error: "A valid event date and time are required" }, { status: 400 })
    }
    const endAt = toTimestamp(body.date, body.end_time, body.end_at)

    const price = body.is_free ? 0 : Number(body.ticket_price ?? body.price ?? 0) || 0
    const capacityRaw = body.max_attendees ?? body.capacity
    const capacity = capacityRaw ? Number.parseInt(String(capacityRaw)) : null

    const { data: event, error } = await supabase
      .from("events")
      .insert([
        {
          title: body.title,
          description: body.description,
          event_type: body.category || body.event_type || "networking",
          start_at: startAt,
          end_at: endAt,
          location: body.location || null,
          is_virtual: body.is_virtual || false,
          meeting_url: body.google_meet_link || body.meeting_link || body.meeting_url || null,
          capacity,
          is_public: body.is_public ?? true,
          ticket_price: price,
          image_url: body.image_url || null,
          organizer_id: userData.user.id,
          status: "approved",
        },
      ])
      .select(EVENT_SELECT)
      .single()

    if (error) {
      console.error("[events] creation error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(normalizeEvent(event))
  } catch (error: any) {
    console.error("[events] creation error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
