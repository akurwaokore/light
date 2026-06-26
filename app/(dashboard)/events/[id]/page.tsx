"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  Video,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Link as LinkIcon,
  Pencil,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EventForm } from "@/components/events/event-form"
import { toast } from "sonner"

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
  registered_count?: number
  organizer?: {
    id: string
    display_name: string
    photo_url: string | null
  }
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = !!event?.organizer?.id && event.organizer.id === currentUserId

  useEffect(() => {
    if (params.id) {
      fetchEvent()
      fetchMeAndRegistration()
    }
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`, { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeAndRegistration = async () => {
    try {
      const [meRes, regRes] = await Promise.all([
        fetch("/api/profile", { cache: "no-store" }),
        fetch(`/api/events/${params.id}/register`, { cache: "no-store" }),
      ])
      if (meRes.ok) {
        const me = await meRes.json()
        setCurrentUserId(me?.id || null)
      }
      if (regRes.ok) {
        const reg = await regRes.json()
        setIsRegistered(!!reg.registered)
      }
    } catch {
      /* non-fatal */
    }
  }

  const handleRegister = async () => {
    if (!event) return
    setRegistering(true)
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: isRegistered ? "DELETE" : "POST",
      })
      if (response.ok) {
        setIsRegistered(!isRegistered)
        fetchEvent() // refresh booking count
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || "Could not update registration")
      }
    } catch (error) {
      console.error("Registration error:", error)
    } finally {
      setRegistering(false)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!event) return
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success("Event updated")
      setShowEdit(false)
      fetchEvent()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || "Could not update event")
    }
  }

  const handleDelete = async () => {
    if (!event) return
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Event deleted")
        router.push("/events")
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "Could not delete event")
      }
    } finally {
      setDeleting(false)
    }
  }

  // Map the normalized event into the shape EventForm expects for editing.
  const toFormEvent = (e: Event): any => ({
    ...e,
    date: e.start_date ? e.start_date.slice(0, 10) : "",
    time: e.start_date ? new Date(e.start_date).toTimeString().slice(0, 5) : "",
    end_time: e.end_date ? new Date(e.end_date).toTimeString().slice(0, 5) : "",
    category: e.event_type,
    google_meet_link: e.meeting_link || "",
    is_free: !(e.price > 0),
    ticket_price: e.price || 0,
    max_attendees: e.max_attendees ?? "",
  })

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold">Event not found</h2>
        <Button variant="link" asChild className="mt-4">
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    )
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

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            {event.image_url ? (
              <img src={event.image_url} alt={event.title} className="w-full h-64 object-cover" />
            ) : (
              <div className="w-full h-64 bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                <CalendarIcon className="h-16 w-16 text-primary/40" />
              </div>
            )}
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{event.event_type}</Badge>
                  {event.is_virtual && <Badge variant="secondary">Virtual</Badge>}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif">{event.title}</h1>
              </div>

              <div className="flex flex-wrap gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{formatTime(event.start_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {event.is_virtual ? <Video className="h-5 w-5 text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
                  <span>{event.is_virtual ? "Virtual Event" : event.location}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">About this event</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
              <CardDescription>
                {event.price > 0 ? `Cost: KES ${event.price.toLocaleString()}` : "Free Event"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2 min-w-0 text-sm">
                <span className="text-muted-foreground">Availability</span>
                <span className="font-medium truncate">
                  {event.max_attendees ? `Up to ${event.max_attendees} guests` : "Unlimited"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" /> Booked
                </span>
                <span className="font-medium">{event.registered_count ?? 0} registered</span>
              </div>
              {isOwner ? (
                <p className="rounded-md bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                  You're the organizer of this event.
                </p>
              ) : (
              <>
              <Button className="w-full" size="lg" onClick={handleRegister} disabled={registering}>
                {registering ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isRegistered ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Registered
                  </>
                ) : (
                  "Register Now"
                )}
              </Button>
              {isRegistered && (
                <p className="text-center text-xs text-muted-foreground">
                  You are registered for this event.
                </p>
              )}
              </>
              )}
            </CardContent>
          </Card>

          {event.organizer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={event.organizer.photo_url || "/placeholder.svg"} />
                    <AvatarFallback>{event.organizer.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{event.organizer.display_name}</p>
                    <Link href={`/members/${event.organizer.id}`} className="text-xs text-primary hover:underline">
                      View Profile
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {event.is_virtual && event.meeting_link && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Meeting Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="h-4 w-4" />
                    Join Meeting
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {isOwner && (
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            <EventForm event={toFormEvent(event)} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
