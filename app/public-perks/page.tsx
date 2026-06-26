"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Tag,
  User,
  BadgeCheck,
  Loader2,
  ArrowRight,
  Sparkles,
  IdCard,
  Handshake,
  PartyPopper,
} from "lucide-react"
import { PublicPageShell, useIsAdmin } from "@/components/landing/page-shell"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { EditableMedia } from "@/components/cms/editable-media"
import { usePageContent } from "@/hooks/use-page-content"

interface Perk {
  id: string
  business: string
  description: string | null
  discount: string
  category: string
  logoURL: string | null
  owner: string
  is_verified?: boolean
}

const categoryColors: Record<string, string> = {
  Automotive: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  Legal: "bg-purple-500/20 text-purple-200 border-purple-400/30",
  Photography: "bg-pink-500/20 text-pink-200 border-pink-400/30",
  "Business Services": "bg-green-500/20 text-green-200 border-green-400/30",
  Marketing: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
  Travel: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  "Health & Fitness": "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  Shopping: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  Services: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
}

const stepIconMap: Record<string, any> = { IdCard, Handshake, PartyPopper }

const DEFAULTS = {
  headings: {
    partners: {
      eyebrow: "Member benefits",
      title: "Featured Partners",
      subtitle: "Exclusive discounts from alumni-owned businesses — show your membership card to redeem.",
    },
    process: {
      eyebrow: "How it works",
      title: "Save in Three Simple Steps",
      subtitle: "Your alumni status is your ticket to exclusive savings.",
    },
    showcase: { eyebrow: "Why it matters", title: "Support alumni, save money" },
  },
  featuredPerks: [
    {
      business: "Apex Auto Care",
      description: "Premium servicing and detailing for every make and model.",
      discount: "15% off all services",
      category: "Automotive",
      owner: "Class of '09",
    },
    {
      business: "Meridian Legal",
      description: "Trusted counsel for contracts, property and family matters.",
      discount: "Free first consultation",
      category: "Legal",
      owner: "Class of '04",
    },
    {
      business: "Lumen Studios",
      description: "Portrait, event and brand photography that tells your story.",
      discount: "20% off bookings",
      category: "Photography",
      owner: "Class of '15",
    },
    {
      business: "Summit Marketing",
      description: "Growth campaigns, branding and social for ambitious businesses.",
      discount: "10% retainer discount",
      category: "Marketing",
      owner: "Class of '11",
    },
    {
      business: "Wander Travel Co.",
      description: "Curated getaways and group trips for alumni and family.",
      discount: "Member-only fares",
      category: "Travel",
      owner: "Class of '07",
    },
    {
      business: "Vital Fitness Club",
      description: "Strength, mobility and wellness coaching all under one roof.",
      discount: "First month free",
      category: "Health & Fitness",
      owner: "Class of '13",
    },
    {
      business: "Harbor & Co. Shop",
      description: "Locally made goods, gifts and lifestyle essentials.",
      discount: "12% off in-store",
      category: "Shopping",
      owner: "Class of '18",
    },
    {
      business: "Bright Books Services",
      description: "Bookkeeping, tax and advisory for founders and freelancers.",
      discount: "15% off packages",
      category: "Business Services",
      owner: "Class of '06",
    },
  ] as Perk[],
  process: {
    steps: [
      { title: "Join the network", description: "Sign in with your class year and campus to unlock member benefits.", icon: "IdCard" },
      { title: "Show your alumni card", description: "Present your digital membership card in-store or at checkout.", icon: "Handshake" },
      { title: "Enjoy the discount", description: "Redeem your exclusive offer and support a fellow graduate.", icon: "PartyPopper" },
    ],
  },
  showcase: {
    title: "Every perk supports a fellow graduate",
    body: "When you shop with our partners you save money and reinvest in the Light Academy community — keeping alumni businesses thriving for years to come.",
    image_url: "",
    bullets: ["Verified alumni-owned businesses", "Discounts across every category", "New partners added regularly", "No membership fees, ever"],
  },
  cta: {
    title: "Own a business? Become a partner.",
    subtitle: "List your business and offer exclusive perks to thousands of fellow alumni.",
    button: "List your business",
  },
}

export default function PublicPerksPage() {
  const [perks, setPerks] = useState<Perk[]>([])
  const [loading, setLoading] = useState(true)
  const [hero, setHero] = useState<any>({})
  const { content, update } = usePageContent("public-perks", DEFAULTS)

  useEffect(() => {
    fetch("/api/perks")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPerks(Array.isArray(d?.perks) ? d.perks : []))
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch("/api/cms/sections?name=hero:public-perks")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => row?.content && setHero(row.content))
      .catch(() => {})
  }, [])

  const displayPerks = perks.length > 0 ? perks : (content.featuredPerks as Perk[])

  return (
    <PublicPageShell
      hero={{
        badge: hero.badge || "Member benefits",
        title: hero.title || "Exclusive Alumni Perks",
        description:
          hero.description ||
          "Unlock discounts and special offers from alumni-owned businesses around the world. A little reward for staying connected.",
        image: hero.bg_image,
        images: hero.images,
        imageOpacity: hero.image_opacity,
        showLogo: true,
      }}
    >
      {/* SECTION 2 — Perks grid */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <SectionHeading
          eyebrow={content.headings.partners.eyebrow}
          title={content.headings.partners.title}
          subtitle={content.headings.partners.subtitle}
          onEyebrowChange={(v) => update("headings.partners.eyebrow", v)}
          onTitleChange={(v) => update("headings.partners.title", v)}
          onSubtitleChange={(v) => update("headings.partners.subtitle", v)}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          </div>
        ) : (
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayPerks.map((perk, i) => (
              <RevealItem key={perk.id || i}>
                <div className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:bg-white/[0.07] hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55)]">
                  {/* Logo + category */}
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/20 to-white/5 shadow-inner">
                      {perk.logoURL ? (
                        <img
                          src={perk.logoURL || "/placeholder.svg"}
                          alt={perk.business}
                          className="h-12 w-12 rounded object-contain"
                        />
                      ) : (
                        <Tag className="h-6 w-6 text-white/70" />
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                        categoryColors[perk.category] || "bg-white/10 text-white/70 border-white/20"
                      }`}
                    >
                      {perk.category}
                    </span>
                  </div>

                  {/* Business name */}
                  <h3 className="flex items-center gap-1.5 font-serif text-xl font-bold tracking-tight text-white">
                    {perk.business}
                    {perk.is_verified && <BadgeCheck className="h-4 w-4 flex-shrink-0 text-blue-300" />}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 flex-1 text-sm font-light leading-relaxed text-white/65 line-clamp-3">
                    {perk.description}
                  </p>

                  {/* Discount pill */}
                  <div className="mt-5 rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/25 to-purple-500/15 p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-blue-200/80">Exclusive offer</p>
                    <p className="mt-0.5 font-serif text-lg font-bold text-white">{perk.discount}</p>
                  </div>

                  {/* Owner */}
                  <div className="mt-4 flex items-center gap-2 text-xs text-white/55">
                    <User className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{perk.owner}</span>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {/* SECTION 3 — How it works */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        <div className="container relative mx-auto px-4">
          <SectionHeading
            eyebrow={content.headings.process.eyebrow}
            title={content.headings.process.title}
            subtitle={content.headings.process.subtitle}
            onEyebrowChange={(v) => update("headings.process.eyebrow", v)}
            onTitleChange={(v) => update("headings.process.title", v)}
            onSubtitleChange={(v) => update("headings.process.subtitle", v)}
          />
          <RevealGroup className="grid gap-8 md:grid-cols-3">
            {content.process.steps.map((step: any, i: number) => {
              const Icon = stepIconMap[step.icon] || IdCard
              return (
                <RevealItem key={i}>
                  <div className="relative h-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="mb-2 inline-block font-serif text-sm font-bold text-blue-300">Step {i + 1}</span>
                    <h3 className="mb-2 font-serif text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-white/65">{step.description}</p>
                  </div>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </section>

      {/* SECTION 4 — Showcase */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <EditableMedia
              src={content.showcase.image_url}
              alt="Perks showcase"
              className="aspect-[4/3] w-full rounded-[2rem] border border-white/15 shadow-2xl"
              onChange={(url) => update("showcase.image_url", url)}
            >
              <img
                src={content.showcase.image_url || "/placeholder.svg"}
                alt="Perks showcase"
                className="h-full w-full rounded-[2rem] object-cover"
              />
            </EditableMedia>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm uppercase tracking-wider text-white/80">
              {content.headings.showcase.eyebrow}
            </span>
            <h2 className="font-serif text-3xl font-bold leading-tight text-white md:text-4xl">
              {content.showcase.title}
            </h2>
            <p className="mt-4 text-lg font-light leading-relaxed text-white/75">{content.showcase.body}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {content.showcase.bullets.map((b: string, i: number) => (
                <li key={i} className="flex items-center gap-3 text-white/80">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                    <BadgeCheck className="h-3.5 w-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* SECTION 5 — Become a partner CTA */}
      <PerksCta content={content} />
    </PublicPageShell>
  )
}

function PerksCta({ content }: { content: any }) {
  const isAdmin = useIsAdmin()
  return (
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
        {isAdmin && <p className="mt-4 text-xs text-white/40">Tip: hover images to replace · click headings to edit</p>}
      </Reveal>
    </section>
  )
}
