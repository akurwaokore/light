"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2, GripVertical } from "lucide-react"

interface CMSSection {
  id: string
  page_id: string
  section_name: string
  section_type: string
  section_order: number
  is_visible: boolean
}

export default function SectionsManagement() {
  const [sections, setSections] = useState<CMSSection[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    page_id: "",
    section_name: "",
    section_type: "hero",
    section_order: 0,
  })

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      const res = await fetch("/api/cms/sections")
      if (res.ok) {
        const data = await res.json()
        setSections(data)
      }
    } catch (error) {
      console.error("[akurwas] Error fetching sections:", error)
    }
  }

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/cms/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const newSection = await res.json()
        setSections([...sections, newSection])
        setFormData({
          page_id: "",
          section_name: "",
          section_type: "hero",
          section_order: 0,
        })
        setShowForm(false)
      }
    } catch (error) {
      console.error("[akurwas] Error creating section:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cms/sections/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSections(sections.filter((s) => s.id !== id))
      }
    } catch (error) {
      console.error("[akurwas] Error deleting section:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sections Management</h1>
            <p className="text-slate-600 mt-2">Manage page sections with drag-and-drop ordering</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Section
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Create New Section</h2>
            <div className="space-y-4">
              <Input
                placeholder="Section Name"
                value={formData.section_name}
                onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-md"
                value={formData.section_type}
                onChange={(e) => setFormData({ ...formData, section_type: e.target.value })}
              >
                <option value="hero">Hero Section</option>
                <option value="features">Features</option>
                <option value="testimonials">Testimonials</option>
                <option value="cta">Call to Action</option>
                <option value="gallery">Gallery</option>
                <option value="team">Team</option>
                <option value="pricing">Pricing</option>
              </select>
              <Input
                type="number"
                placeholder="Display Order"
                value={formData.section_order}
                onChange={(e) => setFormData({ ...formData, section_order: Number.parseInt(e.target.value) })}
              />
              <div className="flex gap-3">
                <Button onClick={handleCreate}>Create Section</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {sections.map((section) => (
            <Card key={section.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{section.section_name}</h3>
                <p className="text-sm text-slate-600">Type: {section.section_type}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-slate-100 rounded">Order: {section.section_order}</span>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(section.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
