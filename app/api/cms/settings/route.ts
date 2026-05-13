import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get("key")
    
    const supabase = await createServerClient()

    if (key) {
      const { data, error } = await supabase
        .from("cms_settings")
        .select("*")
        .eq("key", key)
        .maybeSingle()
      
      if (error) throw error
      return NextResponse.json(data?.value || null)
    } else {
      const { data, error } = await supabase
        .from("cms_settings")
        .select("*")
      
      if (error) throw error
      return NextResponse.json(data || [])
    }
  } catch (error) {
    console.error("[CMS Settings] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 })

    const { data, error } = await supabase
      .from("cms_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[CMS Settings] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
  }
}
