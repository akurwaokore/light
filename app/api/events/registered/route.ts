import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// GET - The current user's registered/booked events.
export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ events: [] }, { status: 401 })

    const { data, error } = await supabase
      .from("event_registrations")
      .select(
        `id, status, created_at,
         event:events(id, title, description, start_at, end_at, location, is_virtual, meeting_url, event_type, image_url, ticket_price, status, registrations_count, organizer_id)`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[events/registered] error:", error)
      return NextResponse.json({ events: [] }, { status: 500 })
    }

    // Normalise to the shape the events UI expects (start_date / price / meeting_link).
    const events = (data || [])
      .filter((r: any) => r.event)
      .map((r: any) => {
        const e = r.event
        return {
          registration_id: r.id,
          registration_status: r.status,
          id: e.id,
          title: e.title,
          description: e.description,
          start_date: e.start_at,
          end_date: e.end_at,
          location: e.location,
          is_virtual: e.is_virtual,
          meeting_link: e.meeting_url,
          event_type: e.event_type,
          image_url: e.image_url,
          price: Number(e.ticket_price) || 0,
          status: e.status,
        }
      })

    return NextResponse.json({ events }, { headers: { "Cache-Control": "no-store" } })
  } catch (error: any) {
    console.error("[events/registered] error:", error)
    return NextResponse.json({ events: [] }, { status: 500 })
  }
}
