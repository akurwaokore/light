"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, MapPin, Clock, Users, Video, ArrowRight, Plus, Loader2 } from "lucide-react"
import { EventForm } from "@/components/events/event-form"
import Link from "next/link"

interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string | null
  location: string
  is_virtual: boolean
  meeting_link: string | null
  event_type: string
  max_attendees: number | null
  image_url: string | null
  price: number
  organizer?: {
    id: string
    display_name: string
    photo_url: string | null
  }
}

export default function EventsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events?status=approved")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.log("[akurwas] Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: string) => {
    setRegistering(eventId)
    try {
      if (registeredEvents.includes(eventId)) {
        // Unregister
        const response = await fetch(`/api/events/${eventId}/register`, {
          method: "DELETE",
        })
        if (response.ok) {
          setRegisteredEvents((prev) => prev.filter((id) => id !== eventId))
        }
      } else {
        // Register
        const response = await fetch(`/api/events/${eventId}/register`, {
          method: "POST",
        })
        if (response.ok) {
          setRegisteredEvents((prev) => [...prev, eventId])
        }
      }
    } catch (error) {
      console.log("[akurwas] Error registering:", error)
    } finally {
      setRegistering(null)
    }
  }

  const handleCreateEvent = async (data: any) => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        fetchEvents()
      }
    } catch (error) {
      console.log("[akurwas] Error creating event:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEventsForDate = (date: Date | undefined) => {
    if (!date) return []
    return events.filter((event) => {
      const eventDate = new Date(event.start_date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const selectedDateEvents = getEventsForDate(selectedDate)
  const eventDates = events.map((event) => new Date(event.start_date))

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Events</h1>
          <p className="mt-1 text-muted-foreground">Discover and register for upcoming alumni events</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <EventForm onSubmit={handleCreateEvent} onCancel={() => setShowCreateDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
            <CardDescription>Select a date to view events</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasEvent: eventDates,
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: "bold",
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  borderRadius: "50%",
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-6 lg:col-span-2">
          {/* Selected Date Events */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">
                  Events on {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border border-border p-4 transition-colors hover:border-primary/50">
                        <div className="flex items-start justify-between gap-4">
                          <Link href={`/events/${event.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold group-hover:text-primary transition-colors">{event.title}</h4>
                              <Badge variant="secondary">{event.event_type}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(event.start_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                {event.is_virtual ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                {event.is_virtual ? "Virtual" : event.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {event.max_attendees ? `Max ${event.max_attendees}` : "Unlimited"}
                              </span>
                            </div>
                          </Link>
                          <Button
                            variant={registeredEvents.includes(event.id) ? "outline" : "default"}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRegister(event.id)
                            }}
                            disabled={registering === event.id}
                          >
                            {registering === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : registeredEvents.includes(event.id) ? (
                              "Registered"
                            ) : (
                              "Register"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">No events scheduled for this date</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Upcoming Events</CardTitle>
              <CardDescription>Don&apos;t miss these upcoming gatherings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No upcoming events</p>
              ) : (
                events.map((event) => (
                  <Link
                    href={`/events/${event.id}`}
                    key={event.id}
                    className="group flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary/50 cursor-pointer"
                  >
                    {event.image_url && (
                      <img
                        src={event.image_url || "/placeholder.svg"}
                        alt={event.title}
                        className="h-20 w-28 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{formatDate(event.start_date)}</p>
                        </div>
                        <div className="flex gap-2">
                          {event.is_virtual && <Badge variant="secondary">Virtual</Badge>}
                          {event.price > 0 && <Badge>KES {event.price}</Badge>}
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(event.start_date)}
                          </span>
                          {event.max_attendees && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Max {event.max_attendees}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          View Details
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
