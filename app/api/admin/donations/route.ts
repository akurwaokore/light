import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

// donation_campaigns has RLS keyed off profiles.role, which this app's admin
// model (profiles.is_admin / user_roles) doesn't set — so the user-scoped
// client can't read or insert campaigns even for a real admin. We verify admin
// access in code (checkAdminAccess) and then use the service-role client for
// the actual DB work, with a graceful fallback when the key isn't configured.
function db(fallback: any) {
  try {
    return createAdminClient()
  } catch {
    return fallback
  }
}

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_donations")
  if (!authorized) return unauthorizedResponse(status!)

  const { data: campaigns, error } = await db(supabase)
    .from("donation_campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(campaigns)
}

export async function POST(request: Request) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_donations")
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()

  // Whitelist to real columns so an unexpected field can't break the insert.
  const insert: Record<string, any> = {
    title: body.title,
    description: body.description ?? null,
    target_amount: Number(body.target_amount) || 0,
    current_amount: Number(body.current_amount) || 0,
    status: body.status || "active",
    image_url: body.image_url ?? null,
    updated_at: new Date().toISOString(),
  }
  if (!insert.title) return new NextResponse("Campaign name is required", { status: 400 })

  const { data, error } = await db(supabase)
    .from("donation_campaigns")
    .insert([insert])
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}
