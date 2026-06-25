"use client"

import { useEffect, useState } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AnimatedText } from "@/components/landing/animated-text"
import { AnimatedLogo } from "@/components/landing/animated-logo"
import Image from "next/image"

interface PublicHeroProps {
  badge?: string
  title?: string
  description?: string
  image?: string
  images?: string[]
  /** Background image opacity 0–100 (default 12). */
  imageOpacity?: number
  showLogo?: boolean
  scrollProgress?: number
}

export function PublicHero({
  badge,
  title,
  description,
  image,
  images,
  imageOpacity = 12,
  showLogo = true,
  scrollProgress = 0,
}: PublicHeroProps) {
  // Build the slide list: explicit images[] first, else the single image.
  const slides = (images && images.length > 0 ? images : image ? [image] : []).filter(Boolean)
  const [active, setActive] = useState(0)

  // Auto-advance the slideshow when there's more than one image.
  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides.length])

  const op = Math.max(0, Math.min(100, imageOpacity)) / 100

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {slides.length > 0 && (
        <div className="absolute inset-0 z-0">
          {slides.map((src, i) => (
            <Image
              key={src + i}
              src={src}
              alt="Hero background"
              fill
              priority={i === 0}
              className="object-cover transition-opacity duration-1000 ease-in-out"
              style={{ opacity: i === active ? op : 0 }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80" />
          {slides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show slide ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-2 bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            {badge && (
              <div className="hero-text mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                {badge}
              </div>
            )}
            <AnimatedText
              text={title || ""}
              className="hero-text font-serif text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
            />
            <p className="hero-text mx-auto lg:mx-0 mt-6 max-w-xl text-lg text-white/80 text-pretty md:text-xl">
              {description}
            </p>
            <div className="hero-text mt-8 flex flex-col items-center lg:items-start justify-center lg:justify-start gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="glass-button min-w-[200px] bg-white text-black hover:bg-white/90 shadow-2xl"
              >
                <Link href="/dashboard">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="min-w-[200px] border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <Link href="/public-events">Explore Events</Link>
              </Button>
            </div>
          </div>

          {showLogo && (
            <div className="flex-1 flex items-center justify-center">
              <AnimatedLogo scrollProgress={scrollProgress} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
