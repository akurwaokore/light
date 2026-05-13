"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit2 } from "lucide-react"

export default function CMSPortal() {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      const response = await fetch("/api/cms/sections")
      const data = await response.json()
      setSections(data)
    } catch (error) {
      console.error("Failed to fetch sections:", error)
    } finally {
      setLoading(false)
    }
  }

  const cmsItems = [
    {
      title: "Hero Section",
      description: "Edit hero image, headline, and call-to-action",
      href: "/cms-portal/hero-section",
      icon: "🎯",
    },
    {
      title: "Page Sections",
      description: "Manage features, testimonials, and other sections",
      href: "/cms-portal/sections",
      icon: "📄",
    },
    {
      title: "Images",
      description: "Upload and manage all landing page images",
      href: "/cms-portal/images",
      icon: "🖼️",
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">CMS Portal</h1>
        <p className="text-gray-600">Manage your landing page content</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {cmsItems.map((item) => (
          <Card key={item.href} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">{item.icon}</div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={item.href}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Current Sections</h2>
        {loading ? (
          <p>Loading...</p>
        ) : sections.length > 0 ? (
          <div className="space-y-2">
            {sections.map((section) => (
              <div key={section.id} className="p-4 bg-gray-100 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold">{section.section_type}</p>
                  <p className="text-sm text-gray-600">Order: {section.section_order}</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p>No sections created yet</p>
        )}
      </div>
    </div>
  )
}
