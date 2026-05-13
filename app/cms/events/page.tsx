"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Check, X } from "lucide-react"

export default function EventsManagement() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    end_time: "",
    location: "",
    is_virtual: false,
    category: "networking",
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      const data = await response.json()
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setFormData({
          title: "",
          description: "",
          date: "",
          time: "",
          end_time: "",
          location: "",
          is_virtual: false,
          category: "networking",
        })
        setShowForm(false)
        fetchEvents()
      }
    } catch (error) {
      console.error("Error creating event:", error)
    }
  }

  const handleApproveEvent = async (eventId) => {
    try {
      await fetch(`/api/admin/events/${eventId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      fetchEvents()
    } catch (error) {
      console.error("Error approving event:", error)
    }
  }

  const handleRejectEvent = async (eventId) => {
    try {
      await fetch(`/api/admin/events/${eventId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      fetchEvents()
    } catch (error) {
      console.error("Error rejecting event:", error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Events Management</h1>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-8">
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <Input
              placeholder="Event title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Textarea
              placeholder="Event description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
            <Input
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_virtual}
                onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
              />
              <span>Virtual Event</span>
            </label>
            <div className="flex gap-2">
              <Button type="submit">Create Event</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-8 text-center text-slate-500">Loading events...</Card>
      ) : (
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">No events found</Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{event.title}</h3>
                    <p className="text-slate-600 mb-2">{event.description.substring(0, 100)}...</p>
                    <div className="flex gap-4 text-sm text-slate-500">
                      <span>{event.location}</span>
                      <span>{new Date(event.start_date).toLocaleDateString()}</span>
                      <span
                        className={`px-2 py-1 rounded ${event.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.status === "pending_approval" && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveEvent(event.id)}
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => handleRejectEvent(event.id)}
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
