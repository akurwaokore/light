import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_content")
  if (!authorized) return unauthorizedResponse(status!)

  const { data: clubs, error } = await supabase!
    .from("clubs")
    .select(`
      *,
      creator:profiles!clubs_creator_id_fkey(id, display_name, email)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clubs:", error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(clubs)
}
