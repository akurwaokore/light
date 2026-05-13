"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function HeroSectionEditor() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    headline: "",
    subheadline: "",
    cta_primary: "",
    cta_secondary: "",
    hero_image: "",
  })

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchHeroData()
  }, [])

  const fetchHeroData = async () => {
    try {
      const response = await fetch("/api/cms/sections?name=hero")
      const data = await response.json()
      if (data && data.content) {
        setFormData(data.content)
      }
    } catch (error) {
      console.error("Failed to fetch hero data:", error)
      toast({
        title: "Error",
        description: "Failed to load hero section data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("section", "hero")

      const response = await fetch("/api/cms/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      setFormData((prev) => ({ ...prev, backgroundImage: data.url }))
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/cms/sections?name=hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: formData }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Hero section updated successfully.",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Save failed:", error)
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-4xl font-bold mb-2">Edit Hero Section</h1>
      <p className="text-gray-600 mb-8">Customize the landing page hero section</p>

      <Card>
        <CardHeader>
          <CardTitle>Hero Content</CardTitle>
          <CardDescription>Update headline, subheadline, and call-to-action</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Headline</label>
            <Input
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder="Main headline"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subheadline</label>
            <Textarea
              value={formData.subheadline}
              onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
              placeholder="Supporting text"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Primary CTA Text</label>
              <Input
                value={formData.cta_primary}
                onChange={(e) => setFormData({ ...formData, cta_primary: e.target.value })}
                placeholder="e.g. Join the Community"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Secondary CTA Text</label>
              <Input
                value={formData.cta_secondary}
                onChange={(e) => setFormData({ ...formData, cta_secondary: e.target.value })}
                placeholder="e.g. Explore Events"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hero Image</label>
            <div className="border-2 border-dashed rounded-lg p-6">
              {formData.hero_image && (
                <img
                  src={formData.hero_image || "/placeholder.svg"}
                  alt="Hero"
                  className="w-full max-h-48 object-cover rounded mb-4"
                />
              )}
              <div className="flex flex-col gap-4">
                <Input
                  value={formData.hero_image}
                  onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                  placeholder="Image URL or upload below"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button asChild disabled={uploading} variant="outline">
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload New Image"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
