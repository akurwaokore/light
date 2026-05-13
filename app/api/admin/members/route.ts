import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_users")
  if (!authorized) return unauthorizedResponse(status!)

  const { data: members, error } = await supabase!
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(members)
}
