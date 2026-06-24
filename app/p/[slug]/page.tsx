import { createServerClient } from "@/lib/supabase/server"
import { CmsPageRenderer } from "@/components/cms/page-renderer"
import { PublicFooter } from "@/components/layout/public-footer"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

async function loadTree(slug: string) {
  const supabase = await createServerClient()
  const { data: page } = await supabase
    .from("cms_pages").select("id, title, published").eq("slug", slug).maybeSingle()
  if (!page || !page.published) return null

  const { data: sections } = await supabase
    .from("cms_sections").select("id, section_order, settings, is_visible")
    .eq("page_id", page.id).order("section_order")
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
  return { page, tree }
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await loadTree(slug)
  if (!data) notFound()
  return (
    <main className="min-h-screen">
      <CmsPageRenderer tree={data.tree} />
      <PublicFooter />
    </main>
  )
}
