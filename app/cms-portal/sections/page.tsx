"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit2 } from "lucide-react"

export default function SectionsEditor() {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      const response = await fetch("/api/cms/sections")
      const data = await response.json()
      setSections(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch sections:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Page Sections</h1>
          <p className="text-gray-600">Manage features, testimonials, and other sections</p>
        </div>
      </div>

      {loading ? (
        <p>Loading sections...</p>
      ) : sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">{section.section_title || section.section_name}</CardTitle>
                    <CardDescription>System Name: {section.section_name}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={section.section_name === 'hero' ? '/cms-portal/hero-section' : '#'}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Last updated: {new Date(section.updated_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">No sections created yet</p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create First Section
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
