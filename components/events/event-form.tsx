"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, X, Sparkles } from "lucide-react"
import type { EventFull, EventCategory } from "@/src/types/events"

const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "networking", label: "Networking" },
  { value: "professional", label: "Professional Development" },
  { value: "social", label: "Social Gathering" },
  { value: "educational", label: "Educational" },
  { value: "reunion", label: "Class Reunion" },
  { value: "fundraising", label: "Fundraising" },
  { value: "workshop", label: "Workshop" },
  { value: "other", label: "Other" },
]

interface EventFormProps {
  event?: EventFull
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isAdmin?: boolean
}

export function EventForm({ event, onSubmit, onCancel, isAdmin = false }: EventFormProps) {
  const [loading, setLoading] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    date: event?.date || "",
    time: event?.time || "",
    end_time: event?.end_time || "",
    location: event?.location || "",
    is_virtual: event?.is_virtual || false,
    google_meet_link: event?.google_meet_link || "",
    category: event?.category || ("other" as EventCategory),
    max_attendees: event?.max_attendees || "",
    image_url: event?.image_url || "",
    requires_registration: event?.requires_registration ?? true,
    registration_deadline: event?.registration_deadline || "",
    ticket_price: event?.ticket_price || 0,
    is_free: event?.is_free ?? true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(event?.image_url || "")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateDescription = async () => {
    if (!formData.title) return

    setGeneratingDescription(true)
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "event",
          title: formData.title,
          category: formData.category,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({ ...prev, description: data.description }))
      }
    } catch (error) {
      console.log("[akurwas] Error generating description:", error)
    } finally {
      setGeneratingDescription(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = formData.image_url

      // Upload image if new file selected
      if (imageFile) {
        const formDataUpload = new FormData()
        formDataUpload.append("file", imageFile)
        formDataUpload.append("folder", "events")

        const uploadResponse = await fetch("/api/marketplace/upload", {
          method: "POST",
          body: formDataUpload,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.url
        }
      }

      await onSubmit({
        ...formData,
        image_url: imageUrl,
        max_attendees: formData.max_attendees ? Number(formData.max_attendees) : null,
        ticket_price: formData.is_free ? 0 : Number(formData.ticket_price),
      })
    } catch (error) {
      console.log("[akurwas] Error submitting event:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter event title"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={generateDescription}
              disabled={!formData.title || generatingDescription}
            >
              {generatingDescription ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              AI Generate
            </Button>
          </div>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your event..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as EventCategory })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Start Time *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_virtual"
              checked={formData.is_virtual}
              onCheckedChange={(checked) => setFormData({ ...formData, is_virtual: checked })}
            />
            <Label htmlFor="is_virtual">Virtual Event</Label>
          </div>
        </div>

        {formData.is_virtual ? (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="google_meet_link">Google Meet Link</Label>
            <Input
              id="google_meet_link"
              value={formData.google_meet_link}
              onChange={(e) => setFormData({ ...formData, google_meet_link: e.target.value })}
              placeholder="https://meet.google.com/..."
            />
          </div>
        ) : (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter venue address"
              required={!formData.is_virtual}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="max_attendees">Max Attendees</Label>
          <Input
            id="max_attendees"
            type="number"
            value={formData.max_attendees}
            onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
            placeholder="Unlimited"
            min={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_free"
              checked={formData.is_free}
              onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
            />
            <Label htmlFor="is_free">Free Event</Label>
          </div>
        </div>

        {!formData.is_free && (
          <div className="space-y-2">
            <Label htmlFor="ticket_price">Ticket Price (KES)</Label>
            <Input
              id="ticket_price"
              type="number"
              value={formData.ticket_price}
              onChange={(e) => setFormData({ ...formData, ticket_price: Number(e.target.value) })}
              min={0}
            />
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label>Event Image</Label>
          <div className="flex items-center gap-4">
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="h-24 w-32 rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview("")
                    setFormData({ ...formData, image_url: "" })
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <label className="flex h-24 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              <Upload className="h-6 w-6 text-muted-foreground" />
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {event ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  )
}
