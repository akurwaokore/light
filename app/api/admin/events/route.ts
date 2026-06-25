import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET(request: Request) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_events")
  if (!authorized) return unauthorizedResponse(status!)

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get("status")
  const categoryFilter = searchParams.get("category")

  let query = supabase!
    .from("events")
    .select(`*, organizer:profiles!events_organizer_id_fkey(id, display_name, email, photo_url)`)
    .order("start_at", { ascending: false })

  if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter)
  if (categoryFilter && categoryFilter !== "all") query = query.eq("event_type", categoryFilter)

  const { data: events, error } = await query
  if (error) return new NextResponse(error.message, { status: 500 })

  // Provide UI-friendly aliases (start_date/event_type/price/max_attendees)
  // over the canonical live columns so the admin table renders correctly.
  const normalized = (events || []).map((e: any) => {
    const price = Number(e.ticket_price) || 0
    return {
      ...e,
      start_date: e.start_at,
      end_date: e.end_at,
      date: e.start_at ? String(e.start_at).slice(0, 10) : null,
      meeting_link: e.meeting_url,
      category: e.event_type,
      price,
      is_free: !(price > 0),
      max_attendees: e.capacity,
      registered_count: e.registrations_count ?? 0,
    }
  })

  return NextResponse.json(normalized)
}
