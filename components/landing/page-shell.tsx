"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ParticleBackground } from "@/components/landing/particle-background"
import { ScrollIndicator } from "@/components/landing/scroll-indicator"
import { PublicNavbar } from "@/components/layout/public-navbar"
import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHero } from "@/components/layout/public-hero"

interface HeroProps {
  badge?: string
  title?: string
  description?: string
  image?: string
  images?: string[]
  imageOpacity?: number
  showLogo?: boolean
}

const AdminContext = createContext(false)
/** Whether the current viewer is an admin — drives inline edit affordances. */
export const useIsAdmin = () => useContext(AdminContext)

/**
 * PublicPageShell — the single source of truth for the public-page experience.
 * It reproduces, for every page, the exact treatment of the home page:
 *  - Lenis smooth scrolling
 *  - a scroll-driven background colour shift
 *  - the particle background + scroll indicator
 *  - the subtle parallax (rotateX / scale / opacity / translate) applied to the
 *    hero on scroll
 *  - shared navbar + footer
 * Pages only supply hero copy and their content sections as children.
 */
export function PublicPageShell({ hero, children }: { hero: HeroProps; children: ReactNode }) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  // Hoisted parallax hooks (Rules of Hooks: always run).
  const { scrollYProgress } = useScroll()
  const heroRotateX = useTransform(scrollYProgress, [0, 0.2], [0, 15])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.6])
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50])

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.is_admin) setIsAdmin(true)
      })
      .catch(() => {})

    let lenis: any
    let frame = 0
    import("lenis")
      .then(({ default: Lenis }) => {
        lenis = new Lenis({ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
        const raf = (time: number) => {
          lenis.raf(time)
          frame = requestAnimationFrame(raf)
        }
        frame = requestAnimationFrame(raf)
        lenis.on("scroll", () => {
          const denom = document.body.scrollHeight - window.innerHeight
          setScrollProgress(denom > 0 ? Math.min(1, window.scrollY / denom) : 0)
        })
      })
      .catch(() => {})

    return () => {
      cancelAnimationFrame(frame)
      lenis?.destroy?.()
    }
  }, [])

  const backgroundColor = () => {
    const hue = 215 + scrollProgress * 10
    const saturation = 55 + scrollProgress * 15
    const lightness = 12 + scrollProgress * 18
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  return (
    <AdminContext.Provider value={isAdmin}>
      <div
        className="min-h-screen relative text-white"
        style={{ backgroundColor: backgroundColor(), transition: "background-color 0.5s ease" }}
      >
        <ParticleBackground />
        <ScrollIndicator />
        <PublicNavbar />

        <div className="relative overflow-hidden perspective-[1000px]">
          <motion.div
            style={{ rotateX: heroRotateX, scale: heroScale, opacity: heroOpacity, y: heroY }}
            className="origin-top"
          >
            <PublicHero {...hero} scrollProgress={scrollProgress} />
          </motion.div>
        </div>

        <div className="relative z-10">{children}</div>

        <div className="relative z-10">
          <PublicFooter />
        </div>
      </div>
    </AdminContext.Provider>
  )
}
