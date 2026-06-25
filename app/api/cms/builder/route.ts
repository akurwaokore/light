import { createServerClient } from "@/lib/supabase/server"
import { checkAdminAccess } from "@/lib/admin-auth"
import { type NextRequest, NextResponse } from "next/server"

// GET ?slug=home  -> assembled page tree (public; published pages).
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug") || "home"
    const supabase = await createServerClient()

    const { data: page } = await supabase
      .from("cms_pages").select("id, slug, title, published, meta_description, meta_keywords").eq("slug", slug).maybeSingle()
    if (!page) return NextResponse.json({ page: null, tree: [] })

    const { data: sections } = await supabase
      .from("cms_sections")
      .select("id, section_type, section_order, content, settings, is_visible")
      .eq("page_id", page.id)
      .order("section_order", { ascending: true })

    const sectionIds = (sections || []).map((s) => s.id)
    const { data: rows } = sectionIds.length
      ? await supabase.from("cms_rows").select("id, section_id, row_order, settings").in("section_id", sectionIds).order("row_order")
      : { data: [] as any[] }
    const rowIds = (rows || []).map((r: any) => r.id)
    const { data: cols } = rowIds.length
      ? await supabase.from("cms_columns").select("id, row_id, col_order, span, settings").in("row_id", rowIds).order("col_order")
      : { data: [] as any[] }
    const colIds = (cols || []).map((c: any) => c.id)
    const { data: blocks } = colIds.length
      ? await supabase.from("cms_blocks").select("id, column_id, block_order, type, content").in("column_id", colIds).order("block_order")
      : { data: [] as any[] }

    const tree = (sections || []).map((s) => ({
      ...s,
      rows: (rows || []).filter((r: any) => r.section_id === s.id).map((r: any) => ({
        ...r,
        columns: (cols || []).filter((c: any) => c.row_id === r.id).map((c: any) => ({
          ...c,
          blocks: (blocks || []).filter((b: any) => b.column_id === c.id),
        })),
      })),
    }))

    return NextResponse.json({ page, tree })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT { slug, tree } -> atomically replace the page tree (admin only).
export async function PUT(request: NextRequest) {
  try {
    const admin = (await checkAdminAccess()) as any
    if (!admin.authorized || !admin.supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: admin.status || 403 })
    }
    const { slug = "home", title, tree, published, meta_description, meta_keywords } = await request.json()

    // Ensure the page exists (new pages default to published so they render).
    let { data: page } = await admin.supabase.from("cms_pages").select("id").eq("slug", slug).maybeSingle()
    if (!page) {
      const { data: created, error } = await admin.supabase
        .from("cms_pages")
        .insert({ slug, title: title || slug, published: published !== false, created_by: admin.user?.id || null })
        .select("id").single()
      if (error) throw error
      page = created
    }

    // Persist page metadata (title / publish state / SEO) when provided.
    const pageUpdate: any = { updated_by: admin.user?.id || null }
    if (title !== undefined) pageUpdate.title = title
    if (published !== undefined) pageUpdate.published = published
    if (meta_description !== undefined) pageUpdate.meta_description = meta_description
    if (meta_keywords !== undefined) pageUpdate.meta_keywords = meta_keywords
    if (Object.keys(pageUpdate).length) {
      await admin.supabase.from("cms_pages").update(pageUpdate).eq("id", page.id)
    }

    // Only replace the tree when one is supplied (lets metadata-only saves through).
    if (Array.isArray(tree)) {
      const { error: rpcErr } = await admin.supabase.rpc("cms_save_page_tree", { p_page_id: page.id, p_tree: tree })
      if (rpcErr) throw rpcErr
    }
    return NextResponse.json({ success: true, pageId: page.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
