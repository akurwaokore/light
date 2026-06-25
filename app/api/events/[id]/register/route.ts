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

    // Live events schema: status / capacity / registrations_count / ticket_price.
    const { data: event } = await supabase
      .from("events")
      .select("id, title, status, capacity, registrations_count, ticket_price, organizer_id")
      .eq("id", id)
      .single()

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.status !== "approved" && event.status !== "upcoming" && event.status !== "active") {
      return NextResponse.json({ error: "Event is not available for registration" }, { status: 400 })
    }

    if (event.capacity && (event.registrations_count ?? 0) >= event.capacity) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }

    const price = Number(event.ticket_price) || 0

    const { data, error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: id,
        user_id: user.id,
        status: "registered",
        paid_amount: price,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already registered for this event" }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Keep the denormalized count in sync (no DB trigger exists for this).
    await supabase
      .from("events")
      .update({ registrations_count: (event.registrations_count ?? 0) + 1 })
      .eq("id", id)

    // Notify the organizer. `notifications` uses message/link, not content/action_url.
    if (event.organizer_id && event.organizer_id !== user.id) {
      const { data: me } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      await supabase.from("notifications").insert({
        user_id: event.organizer_id,
        type: "event_registration",
        title: "New Event Attendee!",
        message: `${me?.display_name || "Someone"} registered for your event: ${event.title}`,
        link: `/events/${id}`,
        metadata: { eventId: id, userId: user.id },
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

    const { data: existing } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    const { error } = await supabase.from("event_registrations").delete().eq("event_id", id).eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Decrement the denormalized count when a registration actually existed.
    if (existing) {
      const { data: event } = await supabase
        .from("events")
        .select("registrations_count")
        .eq("id", id)
        .single()
      const next = Math.max(0, (event?.registrations_count ?? 1) - 1)
      await supabase.from("events").update({ registrations_count: next }).eq("id", id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
