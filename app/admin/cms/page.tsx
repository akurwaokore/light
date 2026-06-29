"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Upload, 
  Save, 
  Globe, 
  ImageIcon, 
  Layout, 
  MessageSquare, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown,
  BarChart3,
  Video,
  Youtube,
  ImagePlus,
  X,
  FileText,
  PanelBottom
} from "lucide-react"
import Image from "next/image"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { PageSectionEditor } from "@/components/admin/page-section-editor"
import { PAGE_DEFAULTS, GLOBAL_DEFAULTS, EDITABLE_PAGES, FOOTER_DEFAULTS } from "@/lib/page-defaults"

/** Deep-merge stored CMS content over a page's defaults (arrays replace). */
function mergeContent(base: any, override: any): any {
  if (Array.isArray(override)) return override
  if (override && typeof override === "object" && base && typeof base === "object" && !Array.isArray(base)) {
    const out: any = { ...base }
    for (const key of Object.keys(override)) out[key] = mergeContent(base[key], override[key])
    return out
  }
  return override === undefined ? base : override
}

/** Immutably set a deep value by dot/array path, e.g. setPath(obj, "columns.explore.links.0.label", "Home"). */
function setPath(obj: any, path: string, value: any): any {
  const keys = path.split(".")
  const root = Array.isArray(obj) ? [...obj] : { ...obj }
  let cursor = root
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    const existing = cursor[k]
    cursor[k] = Array.isArray(existing) ? [...existing] : { ...(existing ?? {}) }
    cursor = cursor[k]
  }
  cursor[keys[keys.length - 1]] = value
  return root
}

/** Read a deep value by dot/array path. */
function getPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}

export default function CMSPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Data State
  const [logo, setLogo] = useState({ url: "/logo.png", alt: "Light Alumni Association" })
  const [hero, setHero] = useState<{
    badge: string; title: string; description: string; bg_image: string; images: string[]; image_opacity: number
  }>({
    badge: "Welcome to the future of alumni networking",
    title: "Where Light Alumni Shine Together",
    description: "Join the official alumni network of Light Group of Schools. Connect with fellow graduates, advance your career, and give back to the community that shaped you.",
    bg_image: "",
    images: [],
    image_opacity: 12,
  })
  // Each front-end page has its own editable hero, stored as a distinct CMS
  // section ("hero" for home, "hero:<slug>" for the rest).
  const HERO_PAGES = [
    { slug: "home", label: "Home" },
    { slug: "features", label: "Features" },
    { slug: "public-events", label: "Public Events" },
    { slug: "public-perks", label: "Perks" },
    { slug: "public-leaderboard", label: "Leaderboard" },
    { slug: "testimonials", label: "Testimonials" },
    { slug: "video-gallery", label: "Video Gallery" },
  ]
  const [heroPage, setHeroPage] = useState("home")
  const heroSectionName = (slug: string) => (slug === "home" ? "hero" : `hero:${slug}`)
  const [features, setFeatures] = useState<any[]>([])
  const [connectedGallery, setConnectedGallery] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [videoGallery, setVideoGallery] = useState<any[]>([])
  const [footer, setFooter] = useState<any>(FOOTER_DEFAULTS)

  // Footer editor helpers — operate on nested paths within the footer object.
  const setFooterField = (path: string, value: any) => setFooter((prev: any) => setPath(prev, path, value))
  const addFooterLink = (listPath: string) =>
    setFooter((prev: any) => setPath(prev, listPath, [...(getPath(prev, listPath) || []), { label: "New link", href: "/" }]))
  const removeFooterLink = (listPath: string, idx: number) =>
    setFooter((prev: any) => setPath(prev, listPath, (getPath(prev, listPath) || []).filter((_: any, i: number) => i !== idx)))
  const moveFooterLink = (listPath: string, idx: number, direction: "up" | "down") =>
    setFooter((prev: any) => {
      const arr = [...(getPath(prev, listPath) || [])]
      const target = direction === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= arr.length) return prev
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return setPath(prev, listPath, arr)
    })

  // Per-page section editor (Pages tab): edits the `page:<slug>` content row.
  const [pageSlug, setPageSlug] = useState(EDITABLE_PAGES[0].slug)
  const [pageContent, setPageContent] = useState<any>(PAGE_DEFAULTS[EDITABLE_PAGES[0].slug])

  const loadPageContent = async (slug: string) => {
    const defaults = PAGE_DEFAULTS[slug] || {}
    try {
      const res = await fetch(`/api/cms/sections?name=${encodeURIComponent(`page:${slug}`)}`)
      if (res.ok) {
        const row = await res.json()
        setPageContent(mergeContent(defaults, row?.content || {}))
        return
      }
    } catch (e) {
      console.error("[CMS] loadPageContent error:", e)
    }
    setPageContent(defaults)
  }
  useEffect(() => { loadPageContent(pageSlug) }, [pageSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [logoRes, sectionsRes] = await Promise.all([
        fetch(`/api/cms/settings?key=logo&t=${Date.now()}`),
        fetch("/api/cms/sections"),
      ])

      if (logoRes.ok) {
        const logoData = await logoRes.json()
        if (logoData && logoData.url) setLogo(logoData)
      }

      if (sectionsRes.ok) {
        const sections = await sectionsRes.json()
        const byName: Record<string, any> = {}
        sections.forEach((section: any) => { byName[section.section_name] = section.content })
        // Pre-load each tab with the live front-end data: use the saved CMS
        // section when present, otherwise fall back to the same defaults the
        // front-end pages render — so the editor is never empty / out of sync.
        const pick = (name: string, fallback: any[]) =>
          Array.isArray(byName[name]?.items) && byName[name].items.length ? byName[name].items : fallback
        setFeatures(pick('features', PAGE_DEFAULTS.features.pillars.items))
        setConnectedGallery(pick('connected_gallery', GLOBAL_DEFAULTS.connected_gallery.items))
        setTestimonials(pick('testimonials', PAGE_DEFAULTS.testimonials.grid.items))
        setStats(pick('stats', GLOBAL_DEFAULTS.stats.items))
        setVideoGallery(pick('video_gallery', GLOBAL_DEFAULTS.video_gallery.items))
        setFooter(mergeContent(FOOTER_DEFAULTS, byName['footer'] || {}))
      }
    } catch (error) {
      console.error("Error fetching CMS data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load the hero for the currently-selected page into the editor.
  const loadHero = async (slug: string) => {
    try {
      const res = await fetch(`/api/cms/sections?name=${encodeURIComponent(heroSectionName(slug))}`)
      if (!res.ok) return
      const section = await res.json()
      const content = section?.content || {}
      setHero({
        badge: content.badge ?? "",
        title: content.title ?? "",
        description: content.description ?? "",
        bg_image: content.bg_image ?? "",
        images: Array.isArray(content.images) ? content.images : content.bg_image ? [content.bg_image] : [],
        image_opacity: content.image_opacity ?? 12,
      })
    } catch (e) {
      console.error("[CMS] loadHero error:", e)
    }
  }
  useEffect(() => { loadHero(heroPage) }, [heroPage]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveSection = async (name: string, content: any) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/cms/sections?name=${encodeURIComponent(name)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Failed to save ${name}`)
      }
      toast({ title: "Success", description: `${name.charAt(0).toUpperCase() + name.slice(1)} updated successfully` })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || `Failed to update ${name}`, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleSeed = async (force = false) => {
    if (force && !confirm("Reset ALL page content back to the built-in defaults? This overwrites current CMS content.")) return
    setSaving(true)
    try {
      const res = await fetch(`/api/cms/seed-pages${force ? "?force=1" : ""}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Seed failed")
      toast({
        title: force ? "Pages reset to defaults" : "Pages seeded",
        description: `Sections created: ${data.sections_created}, updated: ${data.sections_updated}. Builder pages: ${data.pages_created} new, ${data.trees_seeded} populated.`,
      })
      fetchData()
      loadPageContent(pageSlug)
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLogo = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/cms/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "logo", value: logo }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to save logo")
      }
      toast({ title: "Success", description: "Logo updated successfully" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update logo", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero' | 'feature' | 'video' | 'connected') => {
    const file = e.target.files?.[0]
    if (!file) return

    setSaving(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("path", `cms/${type}`)

    try {
      const res = await fetch("/api/cms/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Upload failed")
      }
      const { url } = await res.json()
      
      if (type === 'logo') {
        setLogo((prev) => ({ ...prev, url }))
      } else if (type === 'hero') {
        // Append to the slideshow; keep bg_image as the first image for back-compat.
        setHero((prev) => ({
          ...prev,
          images: [...(prev.images || []), url],
          bg_image: prev.bg_image || url,
        }))
      }
      toast({ title: "Success", description: "Image uploaded successfully" })
      return url
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload image", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const addArrayItem = (setter: any, defaultItem: any) => {
    setter((prev: any) => [...prev, defaultItem])
  }

  const removeArrayItem = (setter: any, index: number) => {
    setter((prev: any) => prev.filter((_: any, i: number) => i !== index))
  }

  const updateArrayItem = (setter: any, index: number, field: string, value: any) => {
    setter((prev: any) => prev.map((item: any, i: number) => i === index ? { ...item, [field]: value } : item))
  }

  const moveItem = (setter: any, index: number, direction: 'up' | 'down') => {
    setter((prev: any) => {
      const newArr = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]]
      return newArr
    })
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AdminHeader />
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Content Management System</h1>
                <p className="text-muted-foreground">Manage your website's dynamic content, sections, and assets.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm">
                  <a href="/admin/cms/builder"><Layout className="mr-1 h-4 w-4" /> Open Page Builder</a>
                </Button>
                <Button onClick={() => handleSeed(false)} disabled={saving} variant="outline" size="sm" className="gap-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Seed Content
                </Button>
                <Button onClick={() => handleSeed(true)} disabled={saving} variant="outline" size="sm" className="text-destructive">
                  Reset to Defaults
                </Button>
                <Button onClick={fetchData} variant="outline" size="sm">Refresh Data</Button>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-medium">New: drag-free Page Builder</p>
              <p className="text-muted-foreground">Build any page (incl. <code>/p/home</code>) from sections → rows → columns → blocks with full layout control. The tabs below still manage the classic landing sections.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="bg-muted/50 p-1 flex-wrap h-auto w-full justify-start overflow-x-auto">
                <TabsTrigger value="general" className="gap-2 shrink-0"><Globe className="h-4 w-4" />General</TabsTrigger>
                <TabsTrigger value="hero" className="gap-2 shrink-0"><Layout className="h-4 w-4" />Hero</TabsTrigger>
                <TabsTrigger value="pages" className="gap-2 shrink-0"><FileText className="h-4 w-4" />Pages</TabsTrigger>
                <TabsTrigger value="features" className="gap-2 shrink-0"><MessageSquare className="h-4 w-4" />Features</TabsTrigger>
                <TabsTrigger value="connected-gallery" className="gap-2 shrink-0"><ImagePlus className="h-4 w-4" />Home Gallery</TabsTrigger>
                <TabsTrigger value="testimonials" className="gap-2 shrink-0"><ImageIcon className="h-4 w-4" />Testimonials</TabsTrigger>
                <TabsTrigger value="stats" className="gap-2 shrink-0"><BarChart3 className="h-4 w-4" />Stats</TabsTrigger>
                <TabsTrigger value="video" className="gap-2 shrink-0"><Video className="h-4 w-4" />Video Gallery</TabsTrigger>
                <TabsTrigger value="footer" className="gap-2 shrink-0"><PanelBottom className="h-4 w-4" />Footer</TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Website Branding</CardTitle><CardDescription>Update your website logo and branding assets.</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start">
                      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                        {logo.url ? <Image src={logo.url} alt={logo.alt} width={100} height={100} className="object-contain p-2" /> : <div className="text-xs text-muted-foreground">No Logo</div>}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="logo-upload">Upload New Logo</Label>
                          <div className="flex items-center gap-4">
                            <Input id="logo-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} disabled={saving} />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="logo-alt">Logo Alt Text</Label>
                          <Input id="logo-alt" value={logo.alt} onChange={(e) => setLogo({ ...logo, alt: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end"><Button onClick={handleSaveLogo} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Branding</Button></div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Hero Tab */}
              <TabsContent value="hero" className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Hero Section</CardTitle><CardDescription>Each page has its own hero — pick a page, then edit its hero.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Editing hero for page</Label>
                      <select
                        value={heroPage}
                        onChange={(e) => setHeroPage(e.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-64"
                      >
                        {HERO_PAGES.map((p) => (
                          <option key={p.slug} value={p.slug}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2"><Label htmlFor="hero-badge">Badge Text</Label><Input id="hero-badge" value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} /></div>
                    <div className="grid gap-2"><Label htmlFor="hero-title">Headline</Label><Input id="hero-title" value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} /></div>
                    <div className="grid gap-2"><Label htmlFor="hero-desc">Description</Label><Input id="hero-desc" value={hero.description} onChange={(e) => setHero({ ...hero, description: e.target.value })} /></div>
                    <div className="grid gap-2">
                      <Label>Hero Images (slideshow)</Label>
                      <p className="text-xs text-muted-foreground">Add multiple images — they auto-rotate as a background slideshow.</p>
                      <div className="flex flex-wrap gap-3">
                        {(hero.images || []).map((img, i) => (
                          <div key={i} className="relative h-20 w-32 overflow-hidden rounded border bg-slate-900">
                            <Image src={img} alt={`Hero ${i + 1}`} width={128} height={80} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              aria-label="Remove image"
                              onClick={() => setHero((prev) => {
                                const images = (prev.images || []).filter((_, idx) => idx !== i)
                                return { ...prev, images, bg_image: images[0] || "" }
                              })}
                              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hero-opacity">Background image opacity: {hero.image_opacity}%</Label>
                      <input
                        id="hero-opacity"
                        type="range" min={0} max={100} step={1}
                        value={hero.image_opacity}
                        onChange={(e) => setHero({ ...hero, image_opacity: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end"><Button onClick={() => saveSection(heroSectionName(heroPage), hero)} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Hero</Button></div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pages Tab — full per-page section editor (page:<slug>) */}
              <TabsContent value="pages" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Page Content</CardTitle>
                    <CardDescription>
                      Edit every section of each public page — headings, copy, list items and images.
                      Changes go live immediately. (Edit each page's hero in the Hero tab.)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-2">
                      <Label>Editing page</Label>
                      <select
                        value={pageSlug}
                        onChange={(e) => setPageSlug(e.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-64"
                      >
                        {EDITABLE_PAGES.map((p) => (
                          <option key={p.slug} value={p.slug}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-lg border bg-muted/10 p-4">
                      <PageSectionEditor value={pageContent} onChange={setPageContent} />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setPageContent(PAGE_DEFAULTS[pageSlug])}
                      >
                        Reset to defaults
                      </Button>
                      <Button
                        onClick={() => saveSection(`page:${pageSlug}`, pageContent)}
                        disabled={saving}
                        className="gap-2 w-full sm:w-auto"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><CardTitle>Features</CardTitle><CardDescription>List your platform's core features.</CardDescription></div>
                    <Button onClick={() => addArrayItem(setFeatures, { title: "New Feature", description: "Description", icon: "Briefcase" })} size="sm" className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" /> Add Feature</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {features.map((feature, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-3 relative group">
                        <div className="absolute right-2 top-2 flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => moveItem(setFeatures, idx, 'up')} disabled={idx === 0}><MoveUp className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => moveItem(setFeatures, idx, 'down')} disabled={idx === features.length - 1}><MoveDown className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeArrayItem(setFeatures, idx)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1"><Label>Title</Label><Input value={feature.title} onChange={(e) => updateArrayItem(setFeatures, idx, 'title', e.target.value)} /></div>
                          <div className="space-y-1"><Label>Icon (Lucide name)</Label><Input value={feature.icon} onChange={(e) => updateArrayItem(setFeatures, idx, 'icon', e.target.value)} /></div>
                        </div>
                        <div className="space-y-1"><Label>Description</Label><Input value={feature.description} onChange={(e) => updateArrayItem(setFeatures, idx, 'description', e.target.value)} /></div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-4"><Button onClick={() => saveSection('features', { items: features })} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Features</Button></div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="connected-gallery" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>Home Scroll Gallery</CardTitle>
                      <CardDescription>Seven pinned images shown after the “Everything You Need to Stay Connected” heading on the home page.</CardDescription>
                    </div>
                    <Button
                      onClick={() => addArrayItem(setConnectedGallery, { image_url: "/placeholder.jpg", alt: "Gallery image" })}
                      size="sm"
                      className="gap-2 w-full sm:w-auto"
                      disabled={connectedGallery.length >= 7}
                    >
                      <Plus className="h-4 w-4" /> Add Image
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Use up to 7 images. Reorder them to control the scroll sequence on the home page.</p>
                    {connectedGallery.map((item, idx) => (
                      <div key={idx} className="relative space-y-4 rounded-lg border p-4">
                        <div className="absolute right-2 top-2 flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => moveItem(setConnectedGallery, idx, 'up')} disabled={idx === 0}><MoveUp className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => moveItem(setConnectedGallery, idx, 'down')} disabled={idx === connectedGallery.length - 1}><MoveDown className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeArrayItem(setConnectedGallery, idx)}><Trash2 className="h-4 w-4" /></Button>
                        </div>

                        <div className="flex flex-col gap-4 pt-6 md:flex-row md:items-start">
                          <div className="relative h-28 w-full overflow-hidden rounded-lg border bg-muted md:w-48">
                            {item.image_url ? (
                              <Image src={item.image_url} alt={item.alt || `Gallery ${idx + 1}`} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="space-y-1">
                              <Label>Alt Text</Label>
                              <Input value={item.alt || ""} onChange={(e) => updateArrayItem(setConnectedGallery, idx, 'alt', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label>Image URL</Label>
                              <Input value={item.image_url || ""} onChange={(e) => updateArrayItem(setConnectedGallery, idx, 'image_url', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label>Upload Replacement</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                className="h-9 py-1 text-xs"
                                onChange={async (e) => {
                                  const url = await handleImageUpload(e, 'connected')
                                  if (url) updateArrayItem(setConnectedGallery, idx, 'image_url', url)
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-4">
                      <Button onClick={() => saveSection('connected_gallery', { items: connectedGallery })} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Home Gallery
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Testimonials Tab */}
              <TabsContent value="testimonials" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><CardTitle>Testimonials</CardTitle><CardDescription>Social proof from your members.</CardDescription></div>
                    <Button onClick={() => addArrayItem(setTestimonials, { quote: "Best platform!", author: "Name", role: "Class of 2024" })} size="sm" className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" /> Add Testimonial</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {testimonials.map((t, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-3 relative">
                        <div className="absolute right-2 top-2 flex gap-1">
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeArrayItem(setTestimonials, idx)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="space-y-1"><Label>Quote</Label><Input value={t.quote} onChange={(e) => updateArrayItem(setTestimonials, idx, 'quote', e.target.value)} /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1"><Label>Author</Label><Input value={t.author} onChange={(e) => updateArrayItem(setTestimonials, idx, 'author', e.target.value)} /></div>
                          <div className="space-y-1"><Label>Role</Label><Input value={t.role} onChange={(e) => updateArrayItem(setTestimonials, idx, 'role', e.target.value)} /></div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-4"><Button onClick={() => saveSection('testimonials', { items: testimonials })} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Testimonials</Button></div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><CardTitle>Stats</CardTitle><CardDescription>Platform impact numbers.</CardDescription></div>
                    <Button onClick={() => addArrayItem(setStats, { label: "New Stat", value: "1,000", icon: "Users" })} size="sm" className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" /> Add Stat</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats.map((s, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-3 relative">
                        <div className="absolute right-2 top-2"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeArrayItem(setStats, idx)}><Trash2 className="h-4 w-4" /></Button></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1"><Label>Label</Label><Input value={s.label} onChange={(e) => updateArrayItem(setStats, idx, 'label', e.target.value)} /></div>
                          <div className="space-y-1"><Label>Value</Label><Input value={s.value} onChange={(e) => updateArrayItem(setStats, idx, 'value', e.target.value)} /></div>
                          <div className="space-y-1"><Label>Icon</Label><Input value={s.icon} onChange={(e) => updateArrayItem(setStats, idx, 'icon', e.target.value)} /></div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-4"><Button onClick={() => saveSection('stats', { items: stats })} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Stats</Button></div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Video Gallery Tab */}
              <TabsContent value="video" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><CardTitle>Video Gallery</CardTitle><CardDescription>Memorable moments from the alumni community.</CardDescription></div>
                    <Button onClick={() => addArrayItem(setVideoGallery, { title: "New Video", subtitle: "Subtitle", image_url: "/placeholder.jpg", video_url: "", type: "youtube", size: "small" })} size="sm" className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" /> Add Item</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {videoGallery.map((v, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-4 relative group">
                        <div className="absolute right-2 top-2 flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => moveItem(setVideoGallery, idx, 'up')} disabled={idx === 0}><MoveUp className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => moveItem(setVideoGallery, idx, 'down')} disabled={idx === videoGallery.length - 1}><MoveDown className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeArrayItem(setVideoGallery, idx)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={v.title} onChange={(e) => updateArrayItem(setVideoGallery, idx, 'title', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Subtitle</Label>
                            <Input value={v.subtitle} onChange={(e) => updateArrayItem(setVideoGallery, idx, 'subtitle', e.target.value)} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> YouTube Video URL</Label>
                            <Input 
                              placeholder="https://www.youtube.com/watch?v=..." 
                              value={v.video_url} 
                              onChange={(e) => updateArrayItem(setVideoGallery, idx, 'video_url', e.target.value)} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`size-${idx}`}>Display Size</Label>
                            <select 
                              id={`size-${idx}`}
                              title="Select Display Size"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={v.size || "small"}
                              onChange={(e) => updateArrayItem(setVideoGallery, idx, 'size', e.target.value)}
                            >
                              <option value="small">Small (1x1)</option>
                              <option value="wide">Wide (2x1)</option>
                              <option value="tall">Tall (1x2)</option>
                              <option value="large">Large (2x2)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Thumbnail Image</Label>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border rounded-md bg-muted/30">
                            <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border bg-background">
                              {v.image_url ? (
                                <Image src={v.image_url} alt="Thumbnail" fill className="object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">No Thumbnail</div>
                              )}
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                              <Input 
                                type="file" 
                                accept="image/*" 
                                className="h-9 py-1 text-xs"
                                onChange={async (e) => {
                                  const url = await handleImageUpload(e, 'video')
                                  if (url) updateArrayItem(setVideoGallery, idx, 'image_url', url)
                                }} 
                              />
                              <p className="text-[10px] text-muted-foreground">Recommended: 1280x720px for best quality.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-4">
                      <Button onClick={() => saveSection('video_gallery', { items: videoGallery })} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Video Gallery
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Footer Tab — edits the shared public-site footer (section `footer`) */}
              <TabsContent value="footer" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Site Footer</CardTitle>
                    <CardDescription>
                      Edit the footer shown across every public page — brand text, social links, columns,
                      contact details and the bottom bar. Changes go live immediately.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Brand */}
                    <div className="rounded-lg border p-4 space-y-3">
                      <h3 className="text-sm font-semibold">Brand</h3>
                      <div className="space-y-1"><Label>Title</Label><Input value={footer.brand?.title || ""} onChange={(e) => setFooterField("brand.title", e.target.value)} /></div>
                      <div className="space-y-1"><Label>Description</Label><Input value={footer.brand?.description || ""} onChange={(e) => setFooterField("brand.description", e.target.value)} /></div>
                    </div>

                    {/* Social links */}
                    <div className="rounded-lg border p-4 space-y-3">
                      <h3 className="text-sm font-semibold">Social Links</h3>
                      <p className="text-xs text-muted-foreground">Leave a field blank to hide that icon.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(["facebook", "twitter", "instagram", "linkedin"] as const).map((key) => (
                          <div key={key} className="space-y-1">
                            <Label className="capitalize">{key}</Label>
                            <Input placeholder="https://..." value={footer.social?.[key] || ""} onChange={(e) => setFooterField(`social.${key}`, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Link columns */}
                    {(["explore", "community"] as const).map((col) => (
                      <div key={col} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold capitalize">{col} Column</h3>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => addFooterLink(`columns.${col}.links`)}><Plus className="h-4 w-4" /> Add Link</Button>
                        </div>
                        <div className="space-y-1"><Label>Column Heading</Label><Input value={footer.columns?.[col]?.title || ""} onChange={(e) => setFooterField(`columns.${col}.title`, e.target.value)} /></div>
                        <div className="space-y-3">
                          {(footer.columns?.[col]?.links || []).map((link: any, idx: number) => (
                            <div key={idx} className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border bg-muted/20 p-3 pr-24">
                              <div className="absolute right-2 top-2 flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => moveFooterLink(`columns.${col}.links`, idx, "up")} disabled={idx === 0}><MoveUp className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => moveFooterLink(`columns.${col}.links`, idx, "down")} disabled={idx === (footer.columns?.[col]?.links?.length || 0) - 1}><MoveDown className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFooterLink(`columns.${col}.links`, idx)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                              <div className="space-y-1"><Label>Label</Label><Input value={link.label || ""} onChange={(e) => setFooterField(`columns.${col}.links.${idx}.label`, e.target.value)} /></div>
                              <div className="space-y-1"><Label>Link (href)</Label><Input value={link.href || ""} onChange={(e) => setFooterField(`columns.${col}.links.${idx}.href`, e.target.value)} /></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Contact */}
                    <div className="rounded-lg border p-4 space-y-3">
                      <h3 className="text-sm font-semibold">Get in Touch</h3>
                      <div className="space-y-1"><Label>Column Heading</Label><Input value={footer.contact?.title || ""} onChange={(e) => setFooterField("contact.title", e.target.value)} /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label>Email</Label><Input value={footer.contact?.email || ""} onChange={(e) => setFooterField("contact.email", e.target.value)} /></div>
                        <div className="space-y-1"><Label>Phone</Label><Input value={footer.contact?.phone || ""} onChange={(e) => setFooterField("contact.phone", e.target.value)} /></div>
                      </div>
                      <div className="space-y-1"><Label>Address</Label><Input value={footer.contact?.address || ""} onChange={(e) => setFooterField("contact.address", e.target.value)} /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label>CTA Button Label</Label><Input value={footer.contact?.cta?.label || ""} onChange={(e) => setFooterField("contact.cta.label", e.target.value)} /></div>
                        <div className="space-y-1"><Label>CTA Button Link</Label><Input value={footer.contact?.cta?.href || ""} onChange={(e) => setFooterField("contact.cta.href", e.target.value)} /></div>
                      </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">Bottom Bar</h3>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => addFooterLink("bottom_links")}><Plus className="h-4 w-4" /> Add Link</Button>
                      </div>
                      <div className="space-y-1">
                        <Label>Copyright text</Label>
                        <Input value={footer.copyright || ""} onChange={(e) => setFooterField("copyright", e.target.value)} />
                        <p className="text-[11px] text-muted-foreground">Shown after “© {new Date().getFullYear()}”.</p>
                      </div>
                      <div className="space-y-3">
                        {(footer.bottom_links || []).map((link: any, idx: number) => (
                          <div key={idx} className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border bg-muted/20 p-3 pr-24">
                            <div className="absolute right-2 top-2 flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => moveFooterLink("bottom_links", idx, "up")} disabled={idx === 0}><MoveUp className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => moveFooterLink("bottom_links", idx, "down")} disabled={idx === (footer.bottom_links?.length || 0) - 1}><MoveDown className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFooterLink("bottom_links", idx)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                            <div className="space-y-1"><Label>Label</Label><Input value={link.label || ""} onChange={(e) => setFooterField(`bottom_links.${idx}.label`, e.target.value)} /></div>
                            <div className="space-y-1"><Label>Link (href)</Label><Input value={link.href || ""} onChange={(e) => setFooterField(`bottom_links.${idx}.href`, e.target.value)} /></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setFooter(FOOTER_DEFAULTS)}>Reset to defaults</Button>
                      <Button onClick={() => saveSection('footer', footer)} disabled={saving} className="gap-2 w-full sm:w-auto">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Footer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
