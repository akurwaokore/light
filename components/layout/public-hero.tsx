"use client"

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
  showLogo?: boolean
  scrollProgress?: number
}

export function PublicHero({ 
  badge, 
  title, 
  description, 
  image, 
  showLogo = true,
  scrollProgress = 0
}: PublicHeroProps) {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={image}
            alt="Hero background"
            fill
            className="object-cover opacity-10"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80" />
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
