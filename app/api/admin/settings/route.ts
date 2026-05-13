import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_settings")
  if (!authorized) return unauthorizedResponse(status!)
  
  const { data: settings, error } = await supabase!
    .from("system_settings")
    .select("*")
    .single()

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(settings || {})
}

export async function POST(request: Request) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_settings")
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()

  const { data, error } = await supabase!
    .from("system_settings")
    .upsert({ 
      id: 1, // Assuming a single row for system settings
      ...body,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
