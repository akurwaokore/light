"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Calendar,
  ShoppingBag,
  CreditCard,
  Users,
  Gift,
  Sparkles,
  ArrowRight,
  Loader2,
  TrendingUp,
} from "lucide-react"
import { PublicPageShell } from "@/components/landing/page-shell"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"
import { SectionHeading } from "@/components/landing/section-heading"
import { usePageContent } from "@/hooks/use-page-content"

interface LeaderboardEntry {
  id: string
  display_name?: string
  full_name?: string
  photo_url?: string
  avatar_url?: string
  campus?: string
  graduation_year?: number
  points: number
  rank: number
}

const CAMPUSES = ["all", "Light Academy Nairobi", "Light Academy Mombasa", "Light Academy Kisumu"]

const earnIconMap: Record<string, any> = { ShoppingBag, CreditCard, Users, Gift, Trophy }

const DEFAULTS = {
  headings: {
    podium: {
      eyebrow: "Friendly competition",
      title: "Top Of The Class",
      subtitle: "Our most engaged alumni, ranked by the points they have earned across the community.",
    },
    rankings: {
      eyebrow: "The standings",
      title: "Full Rankings",
      subtitle: "Every alumni member ranked by total points. Climb the board by staying active.",
    },
    earn: {
      eyebrow: "Get involved",
      title: "How To Earn Points",
      subtitle: "Engage with the community and watch your score grow — the highest scorer wins the annual gift.",
    },
  },
  earn: {
    items: [
      {
        title: "Sell in the marketplace",
        description: "Earn points for every completed sale to fellow alumni.",
        points: "50 pts",
        icon: "ShoppingBag",
      },
      {
        title: "Make a purchase",
        description: "Support alumni businesses and rack up points with each buy.",
        points: "10 pts",
        icon: "CreditCard",
      },
      {
        title: "Join clubs & events",
        description: "Show up, connect and contribute to community gatherings.",
        points: "",
        icon: "Users",
      },
    ],
    prize: {
      title: "End Year Prize",
      description:
        "The alumni member with the highest points at the close of the year wins an exclusive gift at the Annual Alumni Party.",
    },
  },
  cta: {
    title: "Ready to climb the leaderboard?",
    subtitle: "Sign in, get active in the community and start earning points today.",
    button: "Start earning points",
  },
}

function avatarUrl(e: LeaderboardEntry) {
  return e.photo_url || e.avatar_url || ""
}

function displayName(e: LeaderboardEntry) {
  return e.display_name || e.full_name || "Anonymous"
}

function Avatar({ entry, size }: { entry: LeaderboardEntry; size: number }) {
  const url = avatarUrl(entry)
  const name = displayName(entry)
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ height: size, width: size }}
        className="rounded-full object-cover ring-2 ring-white/20"
      />
    )
  }
  return (
    <div
      style={{ height: size, width: size }}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500/60 to-purple-500/60 font-serif font-bold text-white ring-2 ring-white/20"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function rankAccent(rank: number) {
  switch (rank) {
    case 1:
      return { ring: "ring-yellow-400/50", text: "text-yellow-300", glow: "from-yellow-400/20", label: "Champion" }
    case 2:
      return { ring: "ring-gray-300/40", text: "text-gray-200", glow: "from-gray-300/15", label: "2nd Place" }
    case 3:
      return { ring: "ring-orange-400/40", text: "text-orange-300", glow: "from-orange-400/15", label: "3rd Place" }
    default:
      return { ring: "ring-white/10", text: "text-white", glow: "from-white/5", label: "" }
  }
}

function rankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-7 w-7 text-yellow-400" />
    case 2:
      return <Medal className="h-7 w-7 text-gray-300" />
    case 3:
      return <Medal className="h-7 w-7 text-orange-400" />
    default:
      return <Award className="h-5 w-5 text-white/40" />
  }
}

function PodiumCard({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const accent = rankAccent(place)
  const elevated = place === 1
  return (
    <div
      className={`relative flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/25 ${
        elevated ? "md:-mt-8 md:p-8" : "md:mt-4"
      }`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-3xl bg-gradient-to-b ${accent.glow} to-transparent`} />
      {elevated && (
        <Crown className="absolute -top-5 left-1/2 h-9 w-9 -translate-x-1/2 text-yellow-400 drop-shadow-lg" />
      )}
      <div className="relative mb-3 mt-2 flex items-center justify-center">{rankIcon(place)}</div>
      <span className={`mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider ${accent.text}`}>
        {accent.label}
      </span>
      <div className={`mb-3 rounded-full ${accent.ring} ring-4`}>
        <Avatar entry={entry} size={elevated ? 96 : 80} />
      </div>
      <h3 className="font-serif text-xl font-bold text-white">{displayName(entry)}</h3>
      {entry.campus && <p className="mt-1 text-sm text-white/55">{entry.campus}</p>}
      <div className={`mt-4 font-serif text-4xl font-bold ${accent.text}`}>{entry.points}</div>
      <div className="text-xs uppercase tracking-wider text-white/40">points</div>
    </div>
  )
}

function CampusFilter({ campus, onChange }: { campus: string; onChange: (v: string) => void }) {
  return (
    <Select value={campus} onValueChange={onChange}>
      <SelectTrigger className="h-11 w-[230px] rounded-full border-white/15 bg-white/[0.05] text-white backdrop-blur-xl">
        <SelectValue placeholder="Select campus" />
      </SelectTrigger>
      <SelectContent>
        {CAMPUSES.map((c) => (
          <SelectItem key={c} value={c}>
            {c === "all" ? "All Campuses" : c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [campus, setCampus] = useState("all")
  const [hero, setHero] = useState<any>({})
  const { content, update } = usePageContent("public-leaderboard", DEFAULTS)

  useEffect(() => {
    fetch("/api/cms/sections?name=hero:public-leaderboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => row?.content && setHero(row.content))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ campus, limit: "50" })
    fetch(`/api/points/leaderboard?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLeaderboard(Array.isArray(d?.leaderboard) ? d.leaderboard : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [campus])

  return (
    <PublicPageShell
      hero={{
        badge: hero.badge || "Friendly competition",
        title: hero.title || "Alumni Points Leaderboard",
        description:
          hero.description ||
          "Earn points by staying active in the community — selling, buying, joining clubs and showing up to events. The highest scorer wins an exclusive gift at the Annual Alumni Party.",
        image: hero.bg_image,
        images: hero.images,
        imageOpacity: hero.image_opacity,
        showLogo: true,
      }}
    >
      {/* SECTION 2 — Top 3 podium */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <SectionHeading
          eyebrow={content.headings.podium.eyebrow}
          title={content.headings.podium.title}
          subtitle={content.headings.podium.subtitle}
          onEyebrowChange={(v) => update("headings.podium.eyebrow", v)}
          onTitleChange={(v) => update("headings.podium.title", v)}
          onSubtitleChange={(v) => update("headings.podium.subtitle", v)}
        />

        <Reveal className="mb-12 flex justify-center">
          <CampusFilter campus={campus} onChange={setCampus} />
        </Reveal>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          </div>
        ) : leaderboard.length >= 3 ? (
          <Reveal>
            <div className="mx-auto grid max-w-4xl grid-cols-1 items-end gap-6 sm:grid-cols-3">
              <PodiumCard entry={leaderboard[1]} place={2} />
              <PodiumCard entry={leaderboard[0]} place={1} />
              <PodiumCard entry={leaderboard[2]} place={3} />
            </div>
          </Reveal>
        ) : leaderboard.length === 0 ? (
          <Reveal className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] py-16 text-center text-white/60 backdrop-blur-xl">
            No rankings yet. Be the first to earn points and claim the top spot!
          </Reveal>
        ) : null}
      </section>

      {/* SECTION 3 — Full rankings */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        <div className="container relative mx-auto px-4">
          <SectionHeading
            eyebrow={content.headings.rankings.eyebrow}
            title={content.headings.rankings.title}
            subtitle={content.headings.rankings.subtitle}
            onEyebrowChange={(v) => update("headings.rankings.eyebrow", v)}
            onTitleChange={(v) => update("headings.rankings.title", v)}
            onSubtitleChange={(v) => update("headings.rankings.subtitle", v)}
          />

          {!loading && leaderboard.length > 0 ? (
            <Reveal className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl md:p-6">
              <div className="mb-4 flex items-center gap-2 px-2 text-sm font-medium uppercase tracking-wider text-white/50">
                <TrendingUp className="h-4 w-4" />
                All alumni · ranked by points
              </div>
              <RevealGroup className="space-y-2" stagger={0.05}>
                {leaderboard.map((entry) => {
                  const accent = rankAccent(entry.rank)
                  const topThree = entry.rank <= 3
                  return (
                    <RevealItem key={entry.id}>
                      <div
                        className={`flex items-center gap-4 rounded-2xl p-3 transition-all md:p-4 ${
                          topThree
                            ? "border border-white/15 bg-white/[0.05]"
                            : "border border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex w-10 items-center justify-center">
                          {topThree ? rankIcon(entry.rank) : <span className="font-serif text-lg font-semibold text-white/60">#{entry.rank}</span>}
                        </div>
                        <Avatar entry={entry} size={48} />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-serif text-base font-bold text-white">{displayName(entry)}</h3>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/50">
                            {entry.campus && <span>{entry.campus}</span>}
                            {entry.campus && entry.graduation_year && <span>·</span>}
                            {entry.graduation_year && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Class of {entry.graduation_year}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-serif text-xl font-bold ${topThree ? accent.text : "text-white"}`}>
                            {entry.points}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-white/40">points</div>
                        </div>
                      </div>
                    </RevealItem>
                  )
                })}
              </RevealGroup>
            </Reveal>
          ) : !loading ? (
            <Reveal className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] py-16 text-center text-white/60 backdrop-blur-xl">
              No rankings to show yet.
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* SECTION 4 — How to earn points */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <SectionHeading
          eyebrow={content.headings.earn.eyebrow}
          title={content.headings.earn.title}
          subtitle={content.headings.earn.subtitle}
          onEyebrowChange={(v) => update("headings.earn.eyebrow", v)}
          onTitleChange={(v) => update("headings.earn.title", v)}
          onSubtitleChange={(v) => update("headings.earn.subtitle", v)}
        />

        <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.earn.items.map((item: any, i: number) => {
            const Icon = earnIconMap[item.icon] || Sparkles
            return (
              <RevealItem key={i}>
                <div className="group h-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:bg-white/[0.07]">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/5 shadow-inner transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="font-serif text-xl font-bold text-white">{item.title}</h3>
                    {item.points && (
                      <span className="rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-0.5 text-xs font-semibold text-blue-200">
                        {item.points}
                      </span>
                    )}
                  </div>
                  <p className="font-light leading-relaxed text-white/65">{item.description}</p>
                </div>
              </RevealItem>
            )
          })}
        </RevealGroup>

        {/* Highlighted End Year Prize card */}
        <Reveal className="mt-8">
          <div className="relative overflow-hidden rounded-3xl border border-yellow-400/25 bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-transparent p-8 backdrop-blur-xl md:p-10">
            <Gift className="absolute right-6 top-6 h-20 w-20 text-yellow-400/20" />
            <div className="relative flex items-start gap-5">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-yellow-400/20 ring-1 ring-yellow-400/30">
                <Trophy className="h-7 w-7 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-yellow-200">{content.earn.prize.title}</h3>
                <p className="mt-2 max-w-2xl font-light leading-relaxed text-white/75">
                  {content.earn.prize.description}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SECTION 5 — CTA band */}
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
    </PublicPageShell>
  )
}
