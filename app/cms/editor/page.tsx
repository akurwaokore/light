"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GripVertical, Edit, Trash2, Eye, EyeOff } from "lucide-react"

interface Section {
  id: string
  section_name: string
  section_type: string
  section_order: number
  is_visible: boolean
  content: Record<string, unknown>
}

export default function SectionEditor() {
  const [sections, setSections] = useState<Section[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<Record<string, unknown>>({})

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      const res = await fetch("/api/cms/sections")
      const data = await res.json()
      setSections(data.sort((a: Section, b: Section) => a.section_order - b.section_order))
    } catch (error) {
      console.error("[akurwas] Error fetching sections:", error)
    }
  }

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return

    const draggedIndex = sections.findIndex((s) => s.id === draggedId)
    const targetIndex = sections.findIndex((s) => s.id === targetId)

    const newSections = [...sections]
    ;[newSections[draggedIndex], newSections[targetIndex]] = [newSections[targetIndex], newSections[draggedIndex]]

    newSections.forEach((s, i) => {
      s.section_order = i
    })

    setSections(newSections)

    // Update order in database
    try {
      await Promise.all(
        newSections.map((s) =>
          fetch("/api/cms/sections", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: s.id, section_order: s.section_order }),
          }),
        ),
      )
    } catch (error) {
      console.error("[akurwas] Error updating section order:", error)
    }

    setDraggedId(null)
  }

  const handleToggleVisibility = async (id: string) => {
    const section = sections.find((s) => s.id === id)
    if (!section) return

    try {
      const res = await fetch("/api/cms/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_visible: !section.is_visible }),
      })
      if (res.ok) {
        setSections(sections.map((s) => (s.id === id ? { ...s, is_visible: !s.is_visible } : s)))
      }
    } catch (error) {
      console.error("[akurwas] Error toggling visibility:", error)
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/cms/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content: editContent }),
      })
      if (res.ok) {
        setSections(sections.map((s) => (s.id === id ? { ...s, content: editContent } : s)))
        setEditingId(null)
      }
    } catch (error) {
      console.error("[akurwas] Error saving edit:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Section Editor</h1>
        <p className="text-slate-600 mb-8">Drag to reorder sections and edit content</p>

        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(section.id)}
              className="cursor-move"
            >
              <Card className={`p-4 transition-all ${draggedId === section.id ? "opacity-50 scale-95" : ""}`}>
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-slate-400" />

                  {editingId === section.id ? (
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="Section title"
                        value={(editContent.title as string) || ""}
                        onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Section content"
                        value={(editContent.description as string) || ""}
                        onChange={(e) => setEditContent({ ...editContent, description: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(section.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{section.section_name}</h3>
                        <p className="text-sm text-slate-600">Type: {section.section_type}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-100 rounded">Order: {section.section_order}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(section.id)}
                        className={section.is_visible ? "text-green-600" : "text-slate-400"}
                      >
                        {section.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(section.id)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
