import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get("name")
    
    const supabase = await createServerClient()

    if (name) {
      // Tolerate duplicate rows for the same section_name (the DB has several
      // legacy duplicates). Return the most recently updated one rather than
      // erroring out the way .maybeSingle()/.single() would.
      const { data: rows, error } = await supabase
        .from("cms_sections")
        .select("*")
        .eq("section_name", name)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) throw error
      return NextResponse.json(rows?.[0] ?? null)
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

    // Find the newest existing row for this section_name. Using limit(1) instead
    // of .maybeSingle() avoids erroring when legacy duplicates exist (which
    // previously caused every save to INSERT yet another duplicate).
    const { data: existingRows } = await supabase
      .from("cms_sections")
      .select("id")
      .eq("section_name", name)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)

    const existingSection = existingRows?.[0]

    let result;

    if (existingSection) {
      // Update by primary key so we touch exactly one row even if duplicates exist.
      const { data, error } = await supabase
        .from("cms_sections")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", existingSection.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Get landing page ID (only present in the fuller cms_pages schema).
      const { data: landingPage } = await supabase
        .from("cms_pages")
        .select("id")
        .eq("slug", "landing")
        .maybeSingle()

      // Try the full insert first (schema with page_id / section_type).
      const fullInsert = await supabase
        .from("cms_sections")
        .insert({
          section_name: name,
          content,
          page_id: landingPage?.id ?? null,
          section_type: name,
          section_order: 0,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (fullInsert.error) {
        // Fall back to a minimal insert so saves still work on the leaner
        // schema (section_name + content only, no cms_pages dependency).
        const minimalInsert = await supabase
          .from("cms_sections")
          .insert({ section_name: name, content })
          .select()
          .single()

        if (minimalInsert.error) throw minimalInsert.error
        result = minimalInsert.data
      } else {
        result = fullInsert.data
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[CMS] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
  }
}
