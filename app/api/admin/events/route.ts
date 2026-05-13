import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_events")
  if (!authorized) return unauthorizedResponse(status!)

  const { data: events, error } = await supabase!
    .from("events")
    .select(`
      *,
      organizer:profiles(id, display_name, email, photo_url)
    `)
    .order("date", { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(events)
}
