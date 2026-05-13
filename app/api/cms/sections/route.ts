import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get("name")
    
    const supabase = await createServerClient()

    if (name) {
      const { data: section, error } = await supabase
        .from("cms_sections")
        .select("*")
        .eq("section_name", name)
        .maybeSingle()
      
      if (error) throw error
      return NextResponse.json(section)
    } else {
      const { data: sections, error } = await supabase
        .from("cms_sections")
        .select("*")
        .order("created_at")
      
      if (error) throw error
      return NextResponse.json(sections || [])
    }
  } catch (error) {
    console.error("[CMS] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get("name")
    if (!name) return NextResponse.json({ error: "Section name required" }, { status: 400 })

    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const { content } = body

    const { data: existingSection } = await supabase
      .from("cms_sections")
      .select("id")
      .eq("section_name", name)
      .maybeSingle()

    let result;

    if (existingSection) {
      const { data, error } = await supabase
        .from("cms_sections")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("section_name", name)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Get landing page ID
      const { data: landingPage } = await supabase
        .from("cms_pages")
        .select("id")
        .eq("slug", "landing")
        .single()

      if (!landingPage) throw new Error("Landing page not found")

      const { data, error } = await supabase
        .from("cms_sections")
        .insert({
          section_name: name,
          content,
          page_id: landingPage.id,
          section_type: name,
          section_order: 0,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[CMS] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
  }
}
