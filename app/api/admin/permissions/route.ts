import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_roles")
  if (!authorized) return unauthorizedResponse(status!)

  const { data: permissions, error } = await supabase!
    .from("permissions")
    .select("*")
    .order("label", { ascending: true })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(permissions)
}
