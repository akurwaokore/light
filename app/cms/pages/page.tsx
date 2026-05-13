"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"

interface CMSPage {
  id: string
  slug: string
  title: string
  meta_description: string
  is_published: boolean
  created_at: string
}

export default function PagesManagement() {
  const [pages, setPages] = useState<CMSPage[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ slug: "", title: "", meta_description: "", meta_keywords: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/cms/pages")
      if (res.ok) {
        const data = await res.json()
        setPages(data)
      }
    } catch (error) {
      console.error("[akurwas] Error fetching pages:", error)
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cms/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const newPage = await res.json()
        setPages([newPage, ...pages])
        setFormData({ slug: "", title: "", meta_description: "", meta_keywords: "" })
        setShowForm(false)
      }
    } catch (error) {
      console.error("[akurwas] Error creating page:", error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cms/pages/${id}`, { method: "DELETE" })
      if (res.ok) {
        setPages(pages.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error("[akurwas] Error deleting page:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pages Management</h1>
            <p className="text-slate-600 mt-2">Create and manage pages for your website</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Page
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Create New Page</h2>
            <div className="space-y-4">
              <Input
                placeholder="Page Slug (e.g., about-us)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <Input
                placeholder="Page Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Meta Description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              />
              <Input
                placeholder="Meta Keywords"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
              />
              <div className="flex gap-3">
                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? "Creating..." : "Create Page"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-4">
          {pages.map((page) => (
            <Card key={page.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{page.title}</h3>
                <p className="text-sm text-slate-600">/{page.slug}</p>
                <p className="text-xs text-slate-500 mt-1">{page.meta_description}</p>
              </div>
              <div className="flex items-center gap-2">
                {page.is_published ? (
                  <Eye className="w-4 h-4 text-green-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(page.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
