import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// ai_settings has RLS enabled with no public policies — use the service-role
// client for the actual DB work (after verifying admin access in code).
function db(fallback: any) {
  try {
    return createAdminClient()
  } catch {
    return fallback
  }
}

const ALLOWED = [
  "provider",
  "enabled",
  "openai_api_key",
  "openai_model",
  "gemini_api_key",
  "gemini_model",
  "custom_url",
  "custom_api_key",
  "custom_model",
  "custom_auth_header",
  "custom_auth_scheme",
  "custom_format",
]

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_settings")
  if (!authorized) return unauthorizedResponse(status!)

  const { data, error } = await db(supabase).from("ai_settings").select("*").eq("id", 1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data || {}, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_settings")
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json().catch(() => ({}))
  const update: Record<string, any> = { id: 1, updated_at: new Date().toISOString() }
  for (const key of ALLOWED) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  const { data, error } = await db(supabase).from("ai_settings").upsert(update).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
