import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - Fetch events (with filters)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const organizer_id = searchParams.get("organizer_id")
    const pending_only = searchParams.get("pending_only") === "true"

    let query = supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        date,
        time,
        end_time,
        location,
        is_virtual,
        google_meet_link,
        category,
        max_attendees,
        registered_count,
        image_url,
        registration_deadline,
        ticket_price,
        is_free,
        organizer_id,
        status,
        created_at,
        organizer:profiles!events_organizer_id_fkey(id, display_name, email, photo_url)
      `,
      )
      .order("date", { ascending: true })

    if (status) query = query.eq("status", status)
    if (category) query = query.eq("category", category)
    if (organizer_id) query = query.eq("organizer_id", organizer_id)
    if (pending_only) query = query.eq("status", "pending_approval")

    const { data: events, error } = await query

    if (error) {
      console.log("[akurwas] Events fetch error:", error.message)
      return NextResponse.json([])
    }

    return NextResponse.json(events || [])
  } catch (error: any) {
    console.log("[akurwas] Events fetch error:", error.message)
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

    // Robust Date parsing
    const parseDateTime = (dateStr: string, timeStr: string) => {
      if (!dateStr || !timeStr) return null
      try {
        const d = new Date(`${dateStr}T${timeStr}`)
        return isNaN(d.getTime()) ? null : d.toISOString()
      } catch (e) {
        return null
      }
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert([
        {
          title: body.title,
          description: body.description,
          date: body.date,
          time: body.time,
          end_time: body.end_time || null,
          location: body.location,
          is_virtual: body.is_virtual || false,
          google_meet_link: body.google_meet_link || null,
          category: body.category || "networking",
          max_attendees: body.max_attendees ? Number.parseInt(body.max_attendees) : null,
          image_url: body.image_url || "/placeholder.svg",
          registration_deadline: body.registration_deadline || null,
          ticket_price: body.is_free ? 0 : body.ticket_price || 0,
          is_free: body.is_free || false,
          organizer_id: userData.user.id,
          status: body.status || "approved", // Default to approved for admin/frontend creation for now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.log("[akurwas] Event creation error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(event?.[0])
  } catch (error: any) {
    console.log("[akurwas] Event creation error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
