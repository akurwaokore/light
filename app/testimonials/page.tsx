"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Quote, Users, Globe, ThumbsUp, ArrowRight, BadgeCheck } from "lucide-react"
import { PublicPageShell } from "@/components/landing/page-shell"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { EditableMedia } from "@/components/cms/editable-media"
import { usePageContent } from "@/hooks/use-page-content"

interface Testimonial {
  quote: string
  author: string
  role: string
}

const DEFAULTS = {
  headings: {
    grid: {
      eyebrow: "In their words",
      title: "Voices From the Network",
      subtitle: "Real stories from alumni who found connection, opportunity and purpose through the Light Alumni Network.",
    },
    stats: {
      eyebrow: "By the numbers",
      title: "A Community That Keeps Growing",
      subtitle: "Thousands of graduates, spread across the globe, all part of one network.",
    },
  },
  featured: {
    quote:
      "The Light Alumni Network reconnected me with classmates I had lost touch with for over a decade — and one of those reunions turned into the business partnership that changed my career.",
    author: "Amina Yusuf",
    role: "Class of 2009 · Founder, Brightpath Ventures",
    image_url: "",
  },
  grid: {
    items: [
      {
        quote: "I landed my first role abroad through a referral from a fellow alum I met on the platform. The network truly opens doors.",
        author: "Daniel Okeke",
        role: "Class of 2014 · Software Engineer",
      },
      {
        quote: "Mentoring current students has been the most rewarding way to give back. The platform makes it effortless to stay involved.",
        author: "Fatima Hassan",
        role: "Class of 2007 · Pediatrician",
      },
      {
        quote: "From reunions to career workshops, there is always something happening. It feels like the community never graduated.",
        author: "Joseph Mwangi",
        role: "Class of 2011 · Marketing Director",
      },
      {
        quote: "The marketplace and member perks alone have paid for themselves. But the friendships are what keep me coming back.",
        author: "Grace Adeyemi",
        role: "Class of 2016 · Architect",
      },
      {
        quote: "I proposed an event and within a week alumni from three continents had signed up. The reach of this network is incredible.",
        author: "Samuel Tesfaye",
        role: "Class of 2010 · Civil Engineer",
      },
      {
        quote: "Being part of the leaderboard turned giving back into something fun. Earning points while supporting students is brilliant.",
        author: "Nadia Rahman",
        role: "Class of 2013 · Financial Analyst",
      },
    ],
  },
  stats: {
    items: [
      { value: "12,500+", label: "Alumni connected" },
      { value: "45+", label: "Countries represented" },
      { value: "98%", label: "Would recommend" },
    ],
  },
  cta: {
    title: "Have a story to share?",
    subtitle: "Your journey could inspire the next generation of Light Academy graduates. Add your voice to the network.",
    button: "Share your story",
  },
}

export default function TestimonialsPage() {
  const [hero, setHero] = useState<any>({})
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null)
  const { content, update } = usePageContent("testimonials", DEFAULTS)

  useEffect(() => {
    fetch("/api/cms/sections?name=hero:testimonials")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => row?.content && setHero(row.content))
      .catch(() => {})

    fetch("/api/cms/sections?name=testimonials")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        const items = row?.content?.items
        if (Array.isArray(items) && items.length > 0) setTestimonials(items)
      })
      .catch(() => {})
  }, [])

  const items = testimonials ?? content.grid.items

  return (
    <PublicPageShell
      hero={{
        badge: hero.badge || "Community Voices",
        title: hero.title || "Success Stories",
        description:
          hero.description ||
          "Hear from our alumni about how the Light Alumni Network has shaped their journeys, careers and friendships.",
        image: hero.bg_image,
        images: hero.images,
        imageOpacity: hero.image_opacity,
        showLogo: true,
      }}
    >
      {/* SECTION 2 — Featured testimonial */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Reveal className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl md:p-12">
          <Quote className="absolute -right-4 -top-4 h-40 w-40 text-white/[0.04]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[auto,1fr] lg:gap-14">
            <EditableMedia
              src={content.featured.image_url}
              alt={content.featured.author}
              className="mx-auto h-40 w-40 flex-shrink-0 rounded-full border border-white/15 shadow-2xl md:h-52 md:w-52"
              onChange={(url) => update("featured.image_url", url)}
            >
              <img
                src={content.featured.image_url || "/placeholder.svg"}
                alt={content.featured.author}
                className="h-full w-full rounded-full object-cover"
              />
            </EditableMedia>
            <div className="text-center lg:text-left">
              <div className="mb-5 flex justify-center lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-blue-200">
                  <BadgeCheck className="h-4 w-4" />
                  Verified alumni story
                </span>
              </div>
              <p className="font-serif text-2xl font-light italic leading-relaxed text-white md:text-3xl">
                &ldquo;{content.featured.quote}&rdquo;
              </p>
              <p className="mt-6 font-serif text-xl font-bold text-white">{content.featured.author}</p>
              <p className="mt-1 text-blue-400">{content.featured.role}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SECTION 3 — Testimonials grid */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        <div className="container relative mx-auto px-4">
          <SectionHeading
            eyebrow={content.headings.grid.eyebrow}
            title={content.headings.grid.title}
            subtitle={content.headings.grid.subtitle}
            onEyebrowChange={(v) => update("headings.grid.eyebrow", v)}
            onTitleChange={(v) => update("headings.grid.title", v)}
            onSubtitleChange={(v) => update("headings.grid.subtitle", v)}
          />
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t: Testimonial, i: number) => (
              <RevealItem key={i}>
                <div className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:bg-white/[0.07] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]">
                  <div className="mb-6 flex">
                    <BadgeCheck className="h-5 w-5 text-blue-300" />
                  </div>
                  <p className="mb-8 flex-1 text-lg font-light italic leading-relaxed text-white/80">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="border-t border-white/10 pt-6">
                    <p className="font-serif text-lg font-bold text-white">{t.author}</p>
                    <p className="mt-1 text-sm text-blue-400">{t.role}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* SECTION 4 — Stats band */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <SectionHeading
          eyebrow={content.headings.stats.eyebrow}
          title={content.headings.stats.title}
          subtitle={content.headings.stats.subtitle}
          onEyebrowChange={(v) => update("headings.stats.eyebrow", v)}
          onTitleChange={(v) => update("headings.stats.title", v)}
          onSubtitleChange={(v) => update("headings.stats.subtitle", v)}
        />
        <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {content.stats.items.map((stat: any, i: number) => {
            const Icon = [Users, Globe, ThumbsUp][i] || Users
            return (
              <RevealItem key={i}>
                <div className="flex h-full flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur-xl">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-blue-500/80 to-purple-500/80 shadow-inner">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-serif text-4xl font-bold text-white md:text-5xl">{stat.value}</p>
                  <p className="mt-2 text-white/65">{stat.label}</p>
                </div>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </section>

      {/* SECTION 5 — CTA */}
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
        </Reveal>
      </section>
    </PublicPageShell>
  )
}
