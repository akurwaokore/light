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
    .order("date", { ascending: false })

  if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter)
  if (categoryFilter && categoryFilter !== "all") query = query.eq("category", categoryFilter)

  const { data: events, error } = await query
  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(events)
}
