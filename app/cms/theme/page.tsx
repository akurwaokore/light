"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

interface ThemeValue {
  id: string
  theme_key: string
  theme_value: string
  value_type: string
}

export default function ThemeManager() {
  const [themeValues, setThemeValues] = useState<ThemeValue[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ theme_key: "", theme_value: "", value_type: "color" })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchTheme()
  }, [])

  const fetchTheme = async () => {
    try {
      const res = await fetch("/api/cms/theme")
      if (res.ok) {
        const data = await res.json()
        setThemeValues(data)
      }
    } catch (error) {
      console.error("[akurwas] Error fetching theme:", error)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch("/api/cms/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        await fetchTheme()
        setFormData({ theme_key: "", theme_value: "", value_type: "color" })
        setShowForm(false)
      }
    } catch (error) {
      console.error("[akurwas] Error saving theme:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cms/theme/${id}`, { method: "DELETE" })
      if (res.ok) {
        setThemeValues(themeValues.filter((t) => t.id !== id))
      }
    } catch (error) {
      console.error("[akurwas] Error deleting theme:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Theme & Branding</h1>
            <p className="text-slate-600 mt-2">Manage colors, fonts, and brand settings</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Theme Value
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Add Theme Value</h2>
            <div className="space-y-4">
              <Input
                placeholder="Theme Key (e.g., primary-color)"
                value={formData.theme_key}
                onChange={(e) => setFormData({ ...formData, theme_key: e.target.value })}
              />
              <Input
                placeholder="Theme Value"
                value={formData.theme_value}
                onChange={(e) => setFormData({ ...formData, theme_value: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-md"
                value={formData.value_type}
                onChange={(e) => setFormData({ ...formData, value_type: e.target.value })}
              >
                <option value="color">Color</option>
                <option value="font">Font</option>
                <option value="spacing">Spacing</option>
                <option value="text">Text</option>
              </select>
              <div className="flex gap-3">
                <Button onClick={handleSave}>Save Value</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themeValues.map((theme) => (
            <Card key={theme.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{theme.theme_key}</h3>
                  <span className="text-xs px-2 py-1 bg-slate-100 rounded mt-1 inline-block">{theme.value_type}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(theme.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {theme.value_type === "color" && (
                  <div
                    className="w-8 h-8 rounded border border-slate-200"
                    style={{ backgroundColor: theme.theme_value }}
                  />
                )}
                <code className="text-sm text-slate-600 flex-1 break-all">{theme.theme_value}</code>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
