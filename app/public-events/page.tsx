"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Video,
  ArrowRight,
  Search,
  Loader2,
  Users,
  BadgeCheck,
} from "lucide-react"
import { PublicPageShell, useIsAdmin } from "@/components/landing/page-shell"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { EditableMedia } from "@/components/cms/editable-media"
import { usePageContent } from "@/hooks/use-page-content"

interface EventItem {
  id: string
  title: string
  description: string
  start_date: string
  location: string
  is_virtual: boolean
  event_type: string
  max_attendees: number | null
  image_url: string | null
  price: number
}

const DEFAULTS = {
  headings: {
    upcoming: { eyebrow: "What's on", title: "Upcoming Events", subtitle: "Reconnect, network and grow with fellow alumni at our next gatherings." },
    categories: { eyebrow: "Find your fit", title: "Browse by Category", subtitle: "From career workshops to reunions — there's something for everyone." },
    highlights: { eyebrow: "Memories", title: "Highlights From Past Events", subtitle: "A glimpse of the moments our community has shared." },
  },
  categories: {
    items: [
      { title: "Networking", description: "Meet alumni across industries.", image_url: "" },
      { title: "Reunions", description: "Celebrate with your class.", image_url: "" },
      { title: "Workshops", description: "Learn new skills together.", image_url: "" },
      { title: "Social", description: "Relax and have fun.", image_url: "" },
    ],
  },
  highlights: {
    items: [{ image_url: "" }, { image_url: "" }, { image_url: "" }, { image_url: "" }, { image_url: "" }, { image_url: "" }],
  },
  cta: {
    title: "Want to host your own event?",
    subtitle: "Alumni can propose and run events for the community. Sign in to get started.",
    button: "Create an Event",
  },
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [hero, setHero] = useState<any>({})
  const { content, update } = usePageContent("public-events", DEFAULTS)

  useEffect(() => {
    fetch("/api/events?status=approved")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch("/api/cms/sections?name=hero:public-events")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => row?.content && setHero(row.content))
      .catch(() => {})
  }, [])

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const formatTime = (s: string) =>
    new Date(s).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  const filtered = events.filter((e) =>
    [e.title, e.description, e.location].filter(Boolean).some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <PublicPageShell
      hero={{
        badge: hero.badge || "Join our next gathering",
        title: hero.title || "Alumni Events & Meetups",
        description:
          hero.description ||
          "Reconnect, network, and grow with fellow alumni. Browse our upcoming professional and social events.",
        image: hero.bg_image,
        images: hero.images,
        imageOpacity: hero.image_opacity,
        showLogo: true,
      }}
    >
      {/* SECTION 2 — Upcoming events (portrait cards) */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <SectionHeading
          eyebrow={content.headings.upcoming.eyebrow}
          title={content.headings.upcoming.title}
          subtitle={content.headings.upcoming.subtitle}
          onEyebrowChange={(v) => update("headings.upcoming.eyebrow", v)}
          onTitleChange={(v) => update("headings.upcoming.title", v)}
          onSubtitleChange={(v) => update("headings.upcoming.subtitle", v)}
        />

        <Reveal className="mx-auto mb-10 flex max-w-xl items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search events..."
              className="h-12 w-full border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Reveal>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          </div>
        ) : filtered.length === 0 ? (
          <Reveal className="rounded-3xl border border-white/10 bg-white/5 py-20 text-center text-white/60">
            No events found. Check back soon!
          </Reveal>
        ) : (
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((event) => (
              <RevealItem key={event.id}>
                <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55)]">
                  {/* Portrait media */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={event.image_url || "/placeholder.jpg"}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <Badge className="absolute left-4 top-4 border-none bg-blue-600/90 backdrop-blur-sm">
                      {event.event_type}
                    </Badge>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-blue-200">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {formatDate(event.start_date)} · {formatTime(event.start_date)}
                      </div>
                      <h3 className="font-serif text-lg font-bold leading-tight text-white line-clamp-2">
                        {event.title}
                      </h3>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-white/60 line-clamp-3">
                      {event.description}
                    </p>
                    <div className="mb-4 space-y-2 text-xs text-white/70">
                      <div className="flex items-center gap-2">
                        {event.is_virtual ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        <span className="line-clamp-1">{event.location || (event.is_virtual ? "Virtual" : "TBA")}</span>
                      </div>
                      {event.max_attendees ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" />
                          {event.max_attendees} spots
                        </div>
                      ) : null}
                    </div>
                    <Button asChild className="w-full rounded-full bg-blue-600 hover:bg-blue-700">
                      <Link href="/dashboard">Register</Link>
                    </Button>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {/* SECTION 3 — Browse by category */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        <div className="container relative mx-auto px-4">
          <SectionHeading
            eyebrow={content.headings.categories.eyebrow}
            title={content.headings.categories.title}
            subtitle={content.headings.categories.subtitle}
            onEyebrowChange={(v) => update("headings.categories.eyebrow", v)}
            onTitleChange={(v) => update("headings.categories.title", v)}
            onSubtitleChange={(v) => update("headings.categories.subtitle", v)}
          />
          <RevealGroup className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {content.categories.items.map((cat: any, i: number) => (
              <RevealItem key={i}>
                <div className="group relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10">
                  <EditableMedia
                    src={cat.image_url}
                    alt={cat.title}
                    className="absolute inset-0"
                    onChange={(url) => update(`categories.items.${i}.image_url`, url)}
                  >
                    <img
                      src={cat.image_url || "/placeholder.svg"}
                      alt={cat.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </EditableMedia>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                  <div className="pointer-events-none absolute bottom-0 p-5">
                    <h3 className="font-serif text-xl font-bold text-white">{cat.title}</h3>
                    <p className="mt-1 text-sm text-white/60">{cat.description}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* SECTION 4 — Past highlights gallery */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <SectionHeading
          eyebrow={content.headings.highlights.eyebrow}
          title={content.headings.highlights.title}
          subtitle={content.headings.highlights.subtitle}
          onEyebrowChange={(v) => update("headings.highlights.eyebrow", v)}
          onTitleChange={(v) => update("headings.highlights.title", v)}
          onSubtitleChange={(v) => update("headings.highlights.subtitle", v)}
        />
        <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-3" stagger={0.08}>
          {content.highlights.items.map((item: any, i: number) => (
            <RevealItem key={i}>
              <EditableMedia
                src={item.image_url}
                alt={`Highlight ${i + 1}`}
                className={`overflow-hidden rounded-3xl border border-white/10 ${i % 5 === 0 ? "aspect-[4/5] md:row-span-2" : "aspect-square"}`}
                onChange={(url) => update(`highlights.items.${i}.image_url`, url)}
              >
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={`Highlight ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                />
              </EditableMedia>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* SECTION 5 — CTA */}
      <EventsCta content={content} update={update} />
    </PublicPageShell>
  )
}

function EventsCta({ content, update }: { content: any; update: (p: string, v: any) => void }) {
  const isAdmin = useIsAdmin()
  return (
    <section className="container mx-auto px-4 pb-24">
      <Reveal className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-transparent p-10 text-center md:p-16">
        <BadgeCheck className="mx-auto mb-4 h-8 w-8 text-blue-200" />
        <h2 className="font-serif text-3xl font-bold text-white md:text-4xl">{content.cta.title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">{content.cta.subtitle}</p>
        <Button asChild size="lg" className="mt-8 rounded-full bg-white text-black hover:bg-white/90">
          <Link href="/dashboard">
            {content.cta.button}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        {isAdmin && <p className="mt-4 text-xs text-white/40">Tip: hover images to replace · click headings to edit</p>}
      </Reveal>
    </section>
  )
}
