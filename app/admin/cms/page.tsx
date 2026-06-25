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
  X
} from "lucide-react"
import Image from "next/image"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

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
  const [features, setFeatures] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [videoGallery, setVideoGallery] = useState<any[]>([])

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
        sections.forEach((section: any) => {
          switch (section.section_name) {
            case 'hero':
              if (section.content) setHero((prev) => ({
                ...prev,
                ...section.content,
                images: Array.isArray(section.content.images)
                  ? section.content.images
                  : section.content.bg_image ? [section.content.bg_image] : [],
                image_opacity: section.content.image_opacity ?? 12,
              }))
              break
            case 'features':
              if (section.content?.items) setFeatures(section.content.items)
              break
            case 'testimonials':
              if (section.content?.items) setTestimonials(section.content.items)
              break
            case 'stats':
              if (section.content?.items) setStats(section.content.items)
              break
            case 'video_gallery':
              if (section.content?.items) setVideoGallery(section.content.items)
              break
          }
        })
      }
    } catch (error) {
      console.error("Error fetching CMS data:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSection = async (name: string, content: any) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/cms/sections?name=${name}`, {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero' | 'feature' | 'video') => {
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
        <main className="flex-1 p-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Content Management System</h1>
                <p className="text-muted-foreground">Manage your website's dynamic content, sections, and assets.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm">
                  <a href="/admin/cms/builder"><Layout className="mr-1 h-4 w-4" /> Open Page Builder</a>
                </Button>
                <Button onClick={fetchData} variant="outline" size="sm">Refresh Data</Button>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-medium">New: drag-free Page Builder</p>
              <p className="text-muted-foreground">Build any page (incl. <code>/p/home</code>) from sections → rows → columns → blocks with full layout control. The tabs below still manage the classic landing sections.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
                <TabsTrigger value="general" className="gap-2"><Globe className="h-4 w-4" />General</TabsTrigger>
                <TabsTrigger value="hero" className="gap-2"><Layout className="h-4 w-4" />Hero</TabsTrigger>
                <TabsTrigger value="features" className="gap-2"><MessageSquare className="h-4 w-4" />Features</TabsTrigger>
                <TabsTrigger value="testimonials" className="gap-2"><ImageIcon className="h-4 w-4" />Testimonials</TabsTrigger>
                <TabsTrigger value="stats" className="gap-2"><BarChart3 className="h-4 w-4" />Stats</TabsTrigger>
                <TabsTrigger value="video" className="gap-2"><Video className="h-4 w-4" />Video Gallery</TabsTrigger>
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
                  <CardHeader><CardTitle>Hero Section</CardTitle><CardDescription>Manage the hero content and main image.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
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
                    <div className="flex justify-end"><Button onClick={() => saveSection('hero', hero)} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Hero</Button></div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Features</CardTitle><CardDescription>List your platform's core features.</CardDescription></div>
                    <Button onClick={() => addArrayItem(setFeatures, { title: "New Feature", description: "Description", icon: "Briefcase" })} size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Feature</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {features.map((feature, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-3 relative group">
                        <div className="absolute right-2 top-2 flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => moveItem(setFeatures, idx, 'up')} disabled={idx === 0}><MoveUp className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => moveItem(setFeatures, idx, 'down')} disabled={idx === features.length - 1}><MoveDown className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeArrayItem(setFeatures, idx)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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

              {/* Testimonials Tab */}
              <TabsContent value="testimonials" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Testimonials</CardTitle><CardDescription>Social proof from your members.</CardDescription></div>
                    <Button onClick={() => addArrayItem(setTestimonials, { quote: "Best platform!", author: "Name", role: "Class of 2024" })} size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Testimonial</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {testimonials.map((t, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-3 relative">
                        <div className="absolute right-2 top-2 flex gap-1">
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeArrayItem(setTestimonials, idx)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="space-y-1"><Label>Quote</Label><Input value={t.quote} onChange={(e) => updateArrayItem(setTestimonials, idx, 'quote', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-4">
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Stats</CardTitle><CardDescription>Platform impact numbers.</CardDescription></div>
                    <Button onClick={() => addArrayItem(setStats, { label: "New Stat", value: "1,000", icon: "Users" })} size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Stat</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats.map((s, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-3 relative">
                        <div className="absolute right-2 top-2"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeArrayItem(setStats, idx)}><Trash2 className="h-4 w-4" /></Button></div>
                        <div className="grid grid-cols-3 gap-4">
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Video Gallery</CardTitle><CardDescription>Memorable moments from the alumni community.</CardDescription></div>
                    <Button onClick={() => addArrayItem(setVideoGallery, { title: "New Video", subtitle: "Subtitle", image_url: "/placeholder.jpg", video_url: "", type: "youtube", size: "small" })} size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Item</Button>
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
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
