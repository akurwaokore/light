import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_content")
  if (!authorized) return unauthorizedResponse(status!)

  // The live clubs table uses created_by (not creator_id); the old FK name made
  // this query error so the admin clubs list (and post-create refresh) failed.
  const { data: clubs, error } = await supabase!
    .from("clubs")
    .select(`
      *,
      creator:profiles!clubs_created_by_fkey(id, display_name, email)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clubs:", error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(clubs)
}
