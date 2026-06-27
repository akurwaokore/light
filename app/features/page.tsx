"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Briefcase,
  Calendar,
  Heart,
  Gift,
  Trophy,
  CreditCard,
  Users,
  Globe,
  ArrowRight,
  Check,
} from "lucide-react"
import { PublicPageShell } from "@/components/landing/page-shell"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { EditableMedia } from "@/components/cms/editable-media"
import { usePageContent } from "@/hooks/use-page-content"

const iconMap: Record<string, any> = { Briefcase, Calendar, Heart, Gift, Trophy, CreditCard, Users, Globe, Star: Gift }

const DEFAULTS = {
  headings: {
    pillars: { eyebrow: "The platform", title: "Everything You Need to Stay Connected", subtitle: "A complete toolkit to network, grow your career, and give back to the community that shaped you." },
    process: { eyebrow: "Getting started", title: "Up and Running in Three Steps", subtitle: "Joining the network takes less than two minutes." },
    showcase: { eyebrow: "Why it matters", title: "Built for Lifelong Connection" },
  },
  pillars: {
    items: [
      { title: "Professional Networking", description: "Connect with alumni across industries and leverage our global network for opportunities.", icon: "Briefcase" },
      { title: "Exclusive Events", description: "Access reunions, workshops, webinars and networking events all year round.", icon: "Calendar" },
      { title: "Give Back", description: "Support current students through scholarships and mentorship programs.", icon: "Heart" },
      { title: "Member Perks", description: "Enjoy exclusive discounts from alumni-owned businesses worldwide.", icon: "Gift" },
      { title: "Loyalty Rewards", description: "Earn points for engagement and compete on the leaderboard for annual gifts.", icon: "Trophy" },
      { title: "Alumni Card", description: "Coming soon: spend loyalty points at participating alumni businesses.", icon: "CreditCard" },
    ],
  },
  process: {
    steps: [
      { title: "Create your profile", description: "Sign up with your class year and campus to join your cohort." },
      { title: "Connect & explore", description: "Find classmates, browse events, jobs, perks and the marketplace." },
      { title: "Grow & give back", description: "Earn points, mentor students and unlock member rewards." },
    ],
  },
  showcase: {
    title: "More than a directory — a living community",
    body: "From your first login you can pick up old friendships, discover new opportunities and contribute to the next generation of Light Academy graduates.",
    image_url: "",
    bullets: ["Verified alumni-only network", "Career & mentorship matching", "Events across every campus", "Rewards for staying engaged"],
  },
  cta: {
    title: "Ready to shine together?",
    subtitle: "Join thousands of Light Academy alumni already on the platform.",
    button: "Get Started Free",
  },
}

export default function FeaturesPage() {
  const [hero, setHero] = useState<any>({})
  // The feature cards + heading are sourced from the shared `features` CMS
  // section (the same one the admin CMS "Features" tab edits) so the two stay
  // in sync. Falls back to page defaults when the section is empty.
  const [featuresSection, setFeaturesSection] = useState<any>(null)
  const { content, update } = usePageContent("features", DEFAULTS)

  useEffect(() => {
    fetch("/api/cms/sections?name=hero:features")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => row?.content && setHero(row.content))
      .catch(() => {})

    fetch("/api/cms/sections?name=features")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        if (row?.content && Array.isArray(row.content.items) && row.content.items.length) {
          setFeaturesSection(row.content)
        }
      })
      .catch(() => {})
  }, [])

  const pillarItems = featuresSection?.items ?? content.pillars.items
  const pillarTitle = featuresSection?.title ?? content.headings.pillars.title
  const pillarSubtitle = featuresSection?.subtitle ?? content.headings.pillars.subtitle

  return (
    <PublicPageShell
      hero={{
        badge: hero.badge || "Tailored for graduates",
        title: hero.title || "Platform Features",
        description: hero.description || "Explore the tools and benefits designed for our alumni community.",
        image: hero.bg_image,
        images: hero.images,
        imageOpacity: hero.image_opacity,
        showLogo: true,
      }}
    >
      {/* SECTION 2 — Feature pillars */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <SectionHeading
          eyebrow={content.headings.pillars.eyebrow}
          title={pillarTitle}
          subtitle={pillarSubtitle}
          onEyebrowChange={(v) => update("headings.pillars.eyebrow", v)}
          onTitleChange={(v) => update("headings.pillars.title", v)}
          onSubtitleChange={(v) => update("headings.pillars.subtitle", v)}
        />
        <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pillarItems.map((feature: any, i: number) => {
            const Icon = iconMap[feature.icon] || Briefcase
            return (
              <RevealItem key={i}>
                <div className="group h-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:bg-white/[0.07] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/5 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:from-blue-500/80 group-hover:to-purple-500/80">
                    <Icon className="h-8 w-8 text-white drop-shadow-md" />
                  </div>
                  <h3 className="mb-3 font-serif text-2xl font-bold tracking-tight text-white">{feature.title}</h3>
                  <p className="font-light leading-relaxed text-white/70">{feature.description}</p>
                </div>
              </RevealItem>
            )
          })}
        </RevealGroup>
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
            {content.process.steps.map((step: any, i: number) => (
              <RevealItem key={i}>
                <div className="relative h-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 font-serif text-2xl font-bold text-white shadow-lg">
                    {i + 1}
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-white/65">{step.description}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* SECTION 4 — Showcase */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <EditableMedia
              src={content.showcase.image_url}
              alt="Community showcase"
              className="aspect-[4/3] w-full rounded-[2rem] border border-white/15 shadow-2xl"
              onChange={(url) => update("showcase.image_url", url)}
            >
              <img
                src={content.showcase.image_url || "/placeholder.svg"}
                alt="Community showcase"
                className="h-full w-full rounded-[2rem] object-cover"
              />
            </EditableMedia>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm uppercase tracking-wider text-white/80">
              {content.headings.showcase.eyebrow}
            </span>
            <h2 className="font-serif text-3xl font-bold leading-tight text-white md:text-4xl">{content.showcase.title}</h2>
            <p className="mt-4 text-lg font-light leading-relaxed text-white/75">{content.showcase.body}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {content.showcase.bullets.map((b: string, i: number) => (
                <li key={i} className="flex items-center gap-3 text-white/80">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* SECTION 5 — CTA */}
      <section className="container mx-auto px-4 pb-24">
        <Reveal className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-transparent p-10 text-center md:p-16">
          <Check className="mx-auto mb-4 h-8 w-8 text-blue-200" />
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
