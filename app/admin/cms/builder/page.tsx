"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Block = { id?: string; type: string; content: any }
type Column = { id?: string; span: number; blocks: Block[] }
type Row = { id?: string; settings?: any; columns: Column[] }
type Section = { id?: string; section_type: string; is_visible: boolean; settings: any; rows: Row[] }

const BLOCK_TYPES = ["heading", "text", "image", "button", "video", "card", "divider", "spacer", "html"]

const clone = (x: any) => JSON.parse(JSON.stringify(x))
const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  return copy
}

export default function CmsBuilderPage() {
  const [slug, setSlug] = useState("home")
  const [tree, setTree] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pages, setPages] = useState<any[]>([])
  const [newSlug, setNewSlug] = useState("")
  const [pageTitle, setPageTitle] = useState("")
  const [published, setPublished] = useState(true)
  const [metaDesc, setMetaDesc] = useState("")
  const [metaKeywords, setMetaKeywords] = useState("")

  const load = async (s: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cms/builder?slug=${encodeURIComponent(s)}`)
      const data = await res.json()
      setPageTitle(data.page?.title || s)
      setPublished(data.page ? data.page.published !== false : true)
      setMetaDesc(data.page?.meta_description || "")
      setMetaKeywords(data.page?.meta_keywords || "")
      setTree((data.tree || []).map((sec: any) => ({
        id: sec.id,
        section_type: sec.section_type || "section",
        is_visible: sec.is_visible !== false,
        settings: sec.settings || {},
        rows: (sec.rows || []).map((r: any) => ({
          id: r.id,
          settings: r.settings || {},
          columns: (r.columns || []).map((c: any) => ({ id: c.id, span: c.span || 12, blocks: c.blocks || [] })),
        })),
      })))
    } finally {
      setLoading(false)
    }
  }
  const loadPages = async () => {
    try {
      const res = await fetch("/api/cms/pages")
      if (res.ok) setPages(await res.json())
    } catch {}
  }
  useEffect(() => { load(slug); loadPages() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openPage = (s: string) => { setSlug(s); load(s) }
  const createPage = async () => {
    const s = (newSlug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")
    if (!s) return
    setSlug(s)
    setTree([])
    setNewSlug("")
    // Persist an empty page so it appears in the list immediately.
    await fetch("/api/cms/builder", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: s, title: s, tree: [] }),
    })
    loadPages()
    toast.success(`Page "${s}" created — add sections and save.`)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/cms/builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, tree, title: pageTitle, published, meta_description: metaDesc, meta_keywords: metaKeywords }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Save failed")
      toast.success(published ? "Page saved & published" : "Page saved as draft")
      load(slug)
      loadPages()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ---- tree mutators ----
  const update = (fn: (t: Section[]) => void) => setTree((prev) => { const t = clone(prev); fn(t); return t })
  const addSection = () => update((t) => t.push({ section_type: "section", is_visible: true, settings: {}, rows: [] }))
  const addRow = (si: number) => update((t) => t[si].rows.push({ settings: { layout: "grid" }, columns: [{ span: 12, blocks: [] }] }))
  const addColumn = (si: number, ri: number) => update((t) => t[si].rows[ri].columns.push({ span: 6, blocks: [] }))
  const addBlock = (si: number, ri: number, ci: number, type: string) =>
    update((t) => t[si].rows[ri].columns[ci].blocks.push({ type, content: {} }))

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Page Builder</h1>
          <p className="text-sm text-muted-foreground">Build any page from sections, rows, columns and blocks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-40" placeholder="page slug" />
          <Button variant="outline" onClick={() => load(slug)}>Load</Button>
          <Button variant="outline" asChild><a href={`/p/${slug}`} target="_blank" rel="noreferrer"><Eye className="mr-1 h-4 w-4" /> Preview</a></Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save</Button>
        </div>
      </div>

      {/* All CMS pages — visible & editable */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Pages</span>
          <div className="flex items-center gap-2">
            <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="new-page-slug" className="h-8 w-44" />
            <Button size="sm" variant="outline" onClick={createPage}>+ New page</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {pages.length === 0 ? (
            <span className="text-xs text-muted-foreground">No CMS pages yet. Create one, or edit "home".</span>
          ) : (
            pages.map((p: any) => (
              <Button key={p.id} size="sm" variant={p.slug === slug ? "default" : "outline"} onClick={() => openPage(p.slug)}>
                {p.slug}{p.published ? "" : " (draft)"}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Page settings: title, publish state, SEO */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Page title</label>
            <Input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} placeholder="Page title" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Status</label>
            <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              {published ? "Published (live at /p/" + slug + ")" : "Draft (hidden from visitors)"}
            </label>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">SEO description</label>
            <Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} placeholder="Short description for search engines & link previews" className="min-h-[60px]" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">SEO keywords (comma separated)</label>
            <Input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="alumni, networking, careers" />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-5">
          {tree.map((section, si) => (
            <Card key={si} className="border-2">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Section {si + 1}</span>
                  <Input className="h-8 w-40" value={section.section_type}
                    onChange={(e) => update((t) => { t[si].section_type = e.target.value })} placeholder="type" />
                  <label className="flex items-center gap-1 text-sm text-muted-foreground">
                    <input type="checkbox" checked={section.is_visible}
                      onChange={(e) => update((t) => { t[si].is_visible = e.target.checked })} /> visible
                  </label>
                  <Input className="h-8 w-44" placeholder="background (css)" value={section.settings?.background || ""}
                    onChange={(e) => update((t) => { t[si].settings = { ...t[si].settings, background: e.target.value } })} />
                  <div className="ml-auto flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => update((t) => { t.splice(si, 1) })}><Trash2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setTree((p) => move(p, si, -1))}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setTree((p) => move(p, si, 1))}><ArrowDown className="h-4 w-4" /></Button>
                  </div>
                </div>

                {section.rows.map((row, ri) => (
                  <div key={ri} className="rounded-lg border border-dashed p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">Row {ri + 1}</span>
                      <div className="flex items-center gap-1">
                        <Select
                          value={row.settings?.layout || "grid"}
                          onValueChange={(v) => update((t) => { t[si].rows[ri].settings = { ...(t[si].rows[ri].settings || {}), layout: v } })}
                        >
                          <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">12-col grid</SelectItem>
                            <SelectItem value="flex">Flex (equal)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" onClick={() => addColumn(si, ri)}><Plus className="mr-1 h-3 w-3" /> Column</Button>
                        <Button size="icon" variant="ghost" onClick={() => update((t) => { t[si].rows.splice(ri, 1) })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {row.columns.map((col, ci) => (
                        <div key={ci} className="rounded-md bg-muted/40 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Col {ci + 1} · span</span>
                            <Select value={String(col.span)} onValueChange={(v) => update((t) => { t[si].rows[ri].columns[ci].span = Number(v) })}>
                              <SelectTrigger className="h-7 w-20"><SelectValue /></SelectTrigger>
                              <SelectContent>{[3, 4, 6, 8, 9, 12].map((n) => <SelectItem key={n} value={String(n)}>{n}/12</SelectItem>)}</SelectContent>
                            </Select>
                            <Button size="icon" variant="ghost" className="ml-auto" onClick={() => update((t) => { t[si].rows[ri].columns.splice(ci, 1) })}><Trash2 className="h-4 w-4" /></Button>
                          </div>

                          {col.blocks.map((block, bi) => (
                            <div key={bi} className="mb-2 rounded border bg-background p-2">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase text-muted-foreground">{block.type}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => update((t) => { t[si].rows[ri].columns[ci].blocks.splice(bi, 1) })}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                              <BlockEditor block={block} onChange={(content) => update((t) => { t[si].rows[ri].columns[ci].blocks[bi].content = content })} />
                            </div>
                          ))}

                          <Select onValueChange={(type) => addBlock(si, ri, ci, type)}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="+ Add block" /></SelectTrigger>
                            <SelectContent>{BLOCK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <Button size="sm" variant="outline" onClick={() => addRow(si)}><Plus className="mr-1 h-3 w-3" /> Add Row</Button>
              </CardContent>
            </Card>
          ))}

          <Button onClick={addSection} variant="secondary" className="w-full"><Plus className="mr-1 h-4 w-4" /> Add Section</Button>
        </div>
      )}
    </div>
  )
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (c: any) => void }) {
  const c = block.content || {}
  const set = (k: string, v: any) => onChange({ ...c, [k]: v })
  switch (block.type) {
    case "heading":
    case "text":
      return <Textarea className="text-sm" value={c.text || ""} placeholder="Text" onChange={(e) => set("text", e.target.value)} />
    case "image":
      return <div className="space-y-1">
        <Input className="h-8" value={c.url || ""} placeholder="Image URL" onChange={(e) => set("url", e.target.value)} />
        <Input className="h-8" value={c.alt || ""} placeholder="Alt text" onChange={(e) => set("alt", e.target.value)} />
      </div>
    case "button":
      return <div className="space-y-1">
        <Input className="h-8" value={c.label || ""} placeholder="Label" onChange={(e) => set("label", e.target.value)} />
        <Input className="h-8" value={c.href || ""} placeholder="Link (href)" onChange={(e) => set("href", e.target.value)} />
      </div>
    case "video":
      return <Input className="h-8" value={c.url || ""} placeholder="Embed URL (YouTube/Vimeo)" onChange={(e) => set("url", e.target.value)} />
    case "card":
      return <div className="space-y-1">
        <Input className="h-8" value={c.title || ""} placeholder="Card title" onChange={(e) => set("title", e.target.value)} />
        <Textarea className="text-sm" value={c.body || ""} placeholder="Card body" onChange={(e) => set("body", e.target.value)} />
      </div>
    case "spacer":
      return <Input className="h-8" type="number" value={c.height || 32} placeholder="Height px" onChange={(e) => set("height", Number(e.target.value))} />
    case "html":
      return <Textarea className="font-mono text-xs" value={c.html || ""} placeholder="<html>" onChange={(e) => set("html", e.target.value)} />
    default:
      return <p className="text-xs text-muted-foreground">No options</p>
  }
}
