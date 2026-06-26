import { type NextRequest, NextResponse } from "next/server"
import { checkAdminAccess } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  PAGE_DEFAULTS,
  HERO_DEFAULTS,
  GLOBAL_DEFAULTS,
  EDITABLE_PAGES,
  ALL_PUBLIC_PAGES,
} from "@/lib/page-defaults"

/**
 * Seeds the CMS with the current default content for every page so admins can
 * edit / replace / delete it:
 *   - hero / hero:<slug>            (Hero tab + each page's hero)
 *   - page:<slug>                   (Pages tab + the animated public pages)
 *   - features/testimonials/stats/video_gallery (legacy landing sections)
 *   - cms_pages rows + a starter Page Builder tree for every page
 *
 * POST /api/cms/seed-pages           → only fills what's MISSING (safe; never
 *                                       overwrites existing edits)
 * POST /api/cms/seed-pages?force=1   → resets every section back to defaults
 *
 * Admin-gated, then performed with the service-role client so role-based RLS
 * on cms_pages / cms_sections can't silently block the seed.
 */
export async function POST(req: NextRequest) {
  const admin = (await checkAdminAccess()) as any
  if (!admin.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: admin.status || 403 })
  }

  const force = req.nextUrl.searchParams.get("force") === "1"

  let db
  try {
    db = createAdminClient()
  } catch {
    return NextResponse.json(
      { error: "Service role key not configured (SUPABASE_SERVICE_ROLE_KEY) — cannot seed." },
      { status: 500 },
    )
  }

  const summary = { sections_created: 0, sections_updated: 0, pages_created: 0, trees_seeded: 0 }

  try {
    // 1. A non-builder "landing" page to attach the legacy content sections to.
    let { data: landing } = await db.from("cms_pages").select("id").eq("slug", "landing").maybeSingle()
    if (!landing) {
      const { data } = await db
        .from("cms_pages")
        .insert({ slug: "landing", title: "Landing", published: true })
        .select("id")
        .single()
      landing = data
    }
    const landingId = landing?.id

    // 2. Desired content sections (section_name → content).
    const desired: { section_name: string; content: any; section_type: string }[] = [
      { section_name: "hero", content: HERO_DEFAULTS.home, section_type: "hero" },
    ]
    for (const p of ALL_PUBLIC_PAGES) {
      if (p.slug === "home") continue
      desired.push({ section_name: `hero:${p.slug}`, content: HERO_DEFAULTS[p.slug] || {}, section_type: "hero" })
    }
    for (const p of EDITABLE_PAGES) {
      desired.push({ section_name: `page:${p.slug}`, content: PAGE_DEFAULTS[p.slug] || {}, section_type: "page" })
    }
    for (const name of Object.keys(GLOBAL_DEFAULTS)) {
      desired.push({ section_name: name, content: GLOBAL_DEFAULTS[name], section_type: name })
    }

    // Which already exist?
    const { data: existing } = await db.from("cms_sections").select("section_name")
    const have = new Set((existing || []).map((r: any) => r.section_name))

    for (const sec of desired) {
      const row = {
        section_name: sec.section_name,
        content: sec.content,
        page_id: landingId,
        section_type: sec.section_type,
        section_order: 0,
        is_visible: true,
        updated_at: new Date().toISOString(),
      }
      if (!have.has(sec.section_name)) {
        const { error } = await db.from("cms_sections").insert(row)
        if (!error) summary.sections_created++
      } else if (force) {
        const { error } = await db
          .from("cms_sections")
          .update({ content: sec.content, updated_at: row.updated_at })
          .eq("section_name", sec.section_name)
        if (!error) summary.sections_updated++
      }
    }

    // 3. Page Builder: ensure a cms_pages row + a starter tree for every page.
    for (const p of ALL_PUBLIC_PAGES) {
      let { data: page } = await db.from("cms_pages").select("id").eq("slug", p.slug).maybeSingle()
      if (!page) {
        const { data } = await db
          .from("cms_pages")
          .insert({ slug: p.slug, title: p.title, published: true })
          .select("id")
          .single()
        page = data
        if (page) summary.pages_created++
      }
      if (!page) continue

      // Only seed a tree when the builder page is empty (don't clobber edits),
      // unless force is set.
      const { count } = await db
        .from("cms_sections")
        .select("id", { count: "exact", head: true })
        .eq("page_id", page.id)

      if (force || !count) {
        const tree = buildBuilderTree(p.slug)
        const { error } = await db.rpc("cms_save_page_tree", { p_page_id: page.id, p_tree: tree })
        if (!error) summary.trees_seeded++
      }
    }

    return NextResponse.json({ success: true, ...summary })
  } catch (error: any) {
    console.error("[CMS seed] error:", error?.message)
    return NextResponse.json({ error: error?.message || "Seed failed" }, { status: 500 })
  }
}

/** Convert a page's structured defaults into a starter Page Builder tree
 *  (sections → rows → columns → blocks) so the builder shows real content. */
function buildBuilderTree(slug: string) {
  const hero = HERO_DEFAULTS[slug] || HERO_DEFAULTS.home
  const pd: any = PAGE_DEFAULTS[slug] || {}
  const headings: any = pd.headings || {}

  const wrapSection = (section_type: string, order: number, blocks: any[]) => ({
    section_type,
    section_order: order,
    settings: {},
    content: {},
    is_visible: true,
    rows: [{ row_order: 0, settings: {}, columns: [{ col_order: 0, span: 12, settings: {}, blocks }] }],
  })

  const sections: any[] = [
    wrapSection("hero", 0, [
      { block_order: 0, type: "heading", content: { text: hero.title, align: "center" } },
      { block_order: 1, type: "text", content: { text: hero.description, align: "center" } },
      { block_order: 2, type: "button", content: { label: "Get Started", href: "/dashboard" } },
    ]),
  ]

  let order = 1
  for (const key of Object.keys(pd)) {
    if (key === "headings") continue
    const val = pd[key]
    const h = headings[key] || {}
    const blocks: any[] = []
    let b = 0
    if (h.title) blocks.push({ block_order: b++, type: "heading", content: { text: h.title, align: "center" } })
    if (h.subtitle) blocks.push({ block_order: b++, type: "text", content: { text: h.subtitle, align: "center" } })

    const items = Array.isArray(val) ? val : val?.items || val?.steps
    if (Array.isArray(items)) {
      for (const it of items) {
        const title = it.title || it.business || it.author || it.value || it.label || ""
        const body = it.description || it.discount || it.quote || it.role || it.subtitle || it.points || ""
        blocks.push({ block_order: b++, type: "card", content: { title, body } })
      }
    } else if (val && typeof val === "object") {
      if (val.title && !h.title) blocks.push({ block_order: b++, type: "heading", content: { text: val.title, align: "center" } })
      if (val.body) blocks.push({ block_order: b++, type: "text", content: { text: val.body, align: "center" } })
      if (val.subtitle) blocks.push({ block_order: b++, type: "text", content: { text: val.subtitle, align: "center" } })
      if (Array.isArray(val.bullets)) for (const bl of val.bullets) blocks.push({ block_order: b++, type: "text", content: { text: `• ${bl}` } })
      if (val.image_url) blocks.push({ block_order: b++, type: "image", content: { url: val.image_url, alt: h.title || key } })
      if (val.button) blocks.push({ block_order: b++, type: "button", content: { label: val.button, href: "/dashboard" } })
    }

    if (blocks.length) sections.push(wrapSection(key, order++, blocks))
  }

  return sections
}
