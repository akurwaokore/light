"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, ArrowRight, Sparkles, Film } from "lucide-react"
import { PublicPageShell } from "@/components/landing/page-shell"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { EditableMedia } from "@/components/cms/editable-media"
import { usePageContent } from "@/hooks/use-page-content"
import { VideoPlayerModal } from "@/components/landing/video-player-modal"

const DEFAULTS = {
  headings: {
    gallery: {
      eyebrow: "The collection",
      title: "Moments Worth Replaying",
      subtitle: "Browse highlights from graduations, reunions, workshops and the everyday magic of our alumni community.",
    },
    playlists: {
      eyebrow: "Browse by theme",
      title: "Curated Playlists",
      subtitle: "Jump straight to the moments that matter most to you.",
    },
  },
  featured: {
    title: "2024 Graduation Ceremony",
    subtitle: "Watch the full highlight reel from our biggest class yet.",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    image_url: "/kenyan-university-graduation-ceremony-students-in-.jpg",
  },
  gallery: {
    items: [
      {
        title: "Alumni Networking Night",
        subtitle: "Connections that last a lifetime",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        image_url: "/african-professionals-networking-event-nairobi-ken.jpg",
        size: "wide",
      },
      {
        title: "Alumni Sports Day",
        subtitle: "Friendly rivalry, fierce fun",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        image_url: "/kenyan-students-playing-football-soccer-sports-day.jpg",
        size: "tall",
      },
      {
        title: "Career Workshop",
        subtitle: "Learning from the best",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        image_url: "/african-professional-giving-presentation-career-wo.jpg",
        size: undefined,
      },
      {
        title: "Alumni Gala Dinner",
        subtitle: "An evening to remember",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        image_url: "/elegant-african-gala-dinner-event-formal-attire-ke.jpg",
        size: "large",
      },
      {
        title: "Class Reunion",
        subtitle: "Old friends, new stories",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        image_url: "/placeholder.jpg",
        size: undefined,
      },
      {
        title: "Mentorship Stories",
        subtitle: "Paying it forward",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        image_url: "/placeholder.jpg",
        size: "wide",
      },
    ],
  },
  playlists: {
    items: [
      { title: "Graduations", description: "Caps, gowns and cheers.", image_url: "" },
      { title: "Reunions", description: "Reconnecting across the years.", image_url: "" },
      { title: "Workshops", description: "Skills and inspiration.", image_url: "" },
      { title: "Socials", description: "Celebrating together.", image_url: "" },
    ],
  },
  cta: {
    title: "Have a clip to share?",
    subtitle: "Alumni-submitted videos help us tell our story. Sign in to contribute your moments.",
    button: "Go to Dashboard",
  },
}

export default function VideoGalleryPage() {
  const [hero, setHero] = useState<any>({})
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const { content, update } = usePageContent("video-gallery", DEFAULTS)

  useEffect(() => {
    fetch("/api/cms/sections?name=hero:video-gallery")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => row?.content && setHero(row.content))
      .catch(() => {})

    // Legacy gallery section — if populated, override the default items.
    fetch("/api/cms/sections?name=video_gallery")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        const items = row?.content?.items
        if (Array.isArray(items) && items.length > 0) {
          update("gallery.items", items)
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sizeClass = (size?: string) =>
    size === "wide"
      ? "md:col-span-2"
      : size === "tall"
        ? "md:row-span-2"
        : size === "large"
          ? "md:col-span-2 md:row-span-2"
          : ""

  return (
    <PublicPageShell
      hero={{
        badge: hero.badge || "Memorable Moments",
        title: hero.title || "Video Gallery",
        description:
          hero.description ||
          "Relive the best moments from our alumni events, reunions and celebrations.",
        image: hero.bg_image,
        images: hero.images,
        imageOpacity: hero.image_opacity,
        showLogo: true,
      }}
    >
      {/* SECTION 2 — Featured video */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Reveal>
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl">
            <div className="relative aspect-video w-full">
              <EditableMedia
                src={content.featured.image_url}
                alt={content.featured.title}
                kind="image"
                className="absolute inset-0"
                onChange={(url) => update("featured.image_url", url)}
              >
                <img
                  src={content.featured.image_url || "/placeholder.jpg"}
                  alt={content.featured.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </EditableMedia>

              {/* Play overlay — opens the modal. Sits below the admin replace button (z-30). */}
              <button
                type="button"
                onClick={() => setSelectedVideo(content.featured)}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-colors"
                aria-label={`Play ${content.featured.title}`}
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                  <Play className="h-9 w-9 fill-white text-white" />
                </span>
              </button>

              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-6 md:p-10">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/80 backdrop-blur-sm">
                  <Film className="h-3.5 w-3.5" /> Featured
                </span>
                <h2 className="font-serif text-2xl font-bold text-white md:text-4xl">
                  {content.featured.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-white/70 md:text-base">
                  {content.featured.subtitle}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SECTION 3 — Masonry gallery grid */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        <div className="container relative mx-auto px-4">
          <SectionHeading
            eyebrow={content.headings.gallery.eyebrow}
            title={content.headings.gallery.title}
            subtitle={content.headings.gallery.subtitle}
            onEyebrowChange={(v) => update("headings.gallery.eyebrow", v)}
            onTitleChange={(v) => update("headings.gallery.title", v)}
            onSubtitleChange={(v) => update("headings.gallery.subtitle", v)}
          />
          <RevealGroup className="grid grid-flow-dense auto-rows-[200px] grid-cols-1 gap-4 sm:grid-cols-2 md:auto-rows-[250px] md:gap-6 lg:grid-cols-4">
            {content.gallery.items.map((video: any, i: number) => (
              <RevealItem key={i} className={sizeClass(video.size)}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10">
                  <EditableMedia
                    src={video.image_url}
                    alt={video.title}
                    kind="image"
                    className="absolute inset-0"
                    onChange={(url) => update(`gallery.items.${i}.image_url`, url)}
                  >
                    <img
                      src={video.image_url || "/placeholder.jpg"}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </EditableMedia>

                  {/* Play / open-modal overlay — beneath the admin replace button (z-30). */}
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(video)}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 transition-colors"
                    aria-label={`Play ${video.title}`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/40">
                      <Play className="h-6 w-6 fill-white text-white" />
                    </span>
                  </button>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="font-serif font-semibold text-white line-clamp-1">{video.title}</h3>
                    {video.subtitle && (
                      <p className="mt-1 text-xs text-white/60 line-clamp-1">{video.subtitle}</p>
                    )}
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* SECTION 4 — Playlists / categories */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <SectionHeading
          eyebrow={content.headings.playlists.eyebrow}
          title={content.headings.playlists.title}
          subtitle={content.headings.playlists.subtitle}
          onEyebrowChange={(v) => update("headings.playlists.eyebrow", v)}
          onTitleChange={(v) => update("headings.playlists.title", v)}
          onSubtitleChange={(v) => update("headings.playlists.subtitle", v)}
        />
        <RevealGroup className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {content.playlists.items.map((pl: any, i: number) => (
            <RevealItem key={i}>
              <div className="group relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10">
                <EditableMedia
                  src={pl.image_url}
                  alt={pl.title}
                  kind="image"
                  className="absolute inset-0"
                  onChange={(url) => update(`playlists.items.${i}.image_url`, url)}
                >
                  <img
                    src={pl.image_url || "/placeholder.svg"}
                    alt={pl.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </EditableMedia>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="pointer-events-none absolute bottom-0 p-5">
                  <h3 className="font-serif text-xl font-bold text-white">{pl.title}</h3>
                  <p className="mt-1 text-sm text-white/60">{pl.description}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* SECTION 5 — CTA */}
      <section className="container mx-auto px-4 pb-24">
        <Reveal className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-transparent p-10 text-center md:p-16">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-blue-200" />
          <h2 className="font-serif text-3xl font-bold text-white md:text-4xl">{content.cta.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">{content.cta.subtitle}</p>
          <Button asChild size="lg" className="mt-8 rounded-full bg-white text-black hover:bg-white/90">
            <Link href="/dashboard">
              {content.cta.button}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </section>

      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </PublicPageShell>
  )
}
