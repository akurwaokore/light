import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_content")
  if (!authorized) return unauthorizedResponse(status!)

  const { data: posts, error } = await supabase!
    .from("posts")
    .select(`
      *,
      author:profiles(display_name, email)
    `)
    .order("created_at", { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(posts)
}
