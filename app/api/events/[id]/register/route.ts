import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST - Register for event
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

    // Check if event exists and is approved
    const { data: event } = await supabase.from("events").select("*").eq("id", id).single()

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.status !== "approved" && event.status !== "upcoming") {
      return NextResponse.json({ error: "Event is not available for registration" }, { status: 400 })
    }

    // Check max attendees
    if (event.max_attendees && event.registered_count >= event.max_attendees) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: id,
        user_id: user.id,
        status: "registered",
        payment_status: event.is_free ? null : "pending",
        payment_amount: event.is_free ? null : event.ticket_price,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already registered for this event" }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create notification for event organizer
    if (event.organizer_id && event.organizer_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: event.organizer_id,
        type: "event_registration",
        title: "New Event Attendee!",
        content: `${user.user_metadata?.full_name || 'Someone'} has registered for your event: ${event.title}`,
        action_url: `/events/${id}`,
        metadata: { eventId: id, userId: user.id }
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Unregister from event
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

    const { error } = await supabase.from("event_registrations").delete().eq("event_id", id).eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
