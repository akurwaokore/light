"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Users, 
  Video, 
  ArrowRight, 
  Search,
  Filter,
  Loader2,
  Play
} from "lucide-react"
import { PublicNavbar } from "@/components/layout/public-navbar"
import { PublicHero } from "@/components/layout/public-hero"
import { WaveBackground } from "@/components/landing/wave-background"

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
  organizer_name: string
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cmsContent, setCmsContent] = useState<any>({})

  useEffect(() => {
    fetchEvents()
    fetchCms()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events?status=approved")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCms = async () => {
    try {
      const res = await fetch("/api/cms/sections")
      if (res.ok) {
        const sections = await res.json()
        const hero = sections.find((s: any) => s.section_name === 'hero')
        if (hero) setCmsContent({ hero: hero.content })
      }
    } catch (err) {
      console.error(err)
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

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen relative text-white">
      <WaveBackground />
      <PublicNavbar />
      
      <PublicHero 
        badge="Join our next gathering"
        title="Alumni Events & Meetups"
        description="Reconnect, network, and grow with fellow alumni. Browse our upcoming professional and social events."
        image={cmsContent.hero?.bg_image}
        scrollProgress={0}
      />

      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="flex flex-col sm:flex-row gap-4 mb-8 md:mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search events..." 
              className="pl-10 bg-white/5 border-white/10 text-white h-12 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 h-12 w-full sm:w-auto">
            <Filter className="mr-2 h-5 w-5" />
            All Events
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          </div>
        ) : (
          <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="bg-white/5 border-white/10 overflow-hidden group hover:border-blue-500/50 transition-all flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img src={event.image_url || "/placeholder.jpg"} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <Badge className="absolute top-4 left-4 bg-blue-600 border-none">{event.event_type}</Badge>
                </div>
                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(event.start_date)}
                  </div>
                  <CardTitle className="text-xl font-serif text-white">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 flex flex-col">
                  <p className="text-slate-400 text-sm mb-6 flex-1 line-clamp-3">{event.description}</p>
                  <div className="space-y-3 mb-6 text-sm text-slate-300">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-500" />{formatTime(event.start_date)}</div>
                    <div className="flex items-center gap-2">{event.is_virtual ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}{event.location}</div>
                  </div>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/dashboard">Register Now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 bg-black/30 py-12 text-center text-white/60">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Light Group of Schools</p>
        </div>
      </footer>
    </div>
  )
}
