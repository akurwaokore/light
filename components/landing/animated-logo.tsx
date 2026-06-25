"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface AnimatedLogoProps {
  scrollProgress: number
}

import { useState, useEffect as useReactEffect } from "react"

export function AnimatedLogo({ scrollProgress }: AnimatedLogoProps) {
  const logoRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [logoUrl, setLogoUrl] = useState("/light-alumni-logo.png")

  useReactEffect(() => {
    const fetchLogo = async () => {
      try {
        // The logo is ALWAYS the configured CMS logo (key=logo). It must never
        // be replaced by the hero background image — changing the hero
        // background should only affect the background, not the logo.
        const res = await fetch(`/api/cms/settings?key=logo&t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.url) setLogoUrl(data.url)
        }
      } catch (err) {
        console.error("Error fetching logo:", err)
      }
    }
    fetchLogo()
  }, [])

  useEffect(() => {
    if (!logoRef.current) return

    const scale = 1 + Math.sin(scrollProgress * Math.PI) * 0.1
    const translateY = scrollProgress * -30

    gsap.to(logoRef.current, {
      scale: scale,
      y: translateY,
      duration: 0.3,
      ease: "power2.out",
    })

    // Animate glow based on scroll
    if (glowRef.current) {
      const glowOpacity = 0.3 + Math.sin(scrollProgress * Math.PI * 2) * 0.3
      const glowScale = 1.1 + Math.sin(scrollProgress * Math.PI) * 0.2

      gsap.to(glowRef.current, {
        opacity: glowOpacity,
        scale: glowScale,
        duration: 0.3,
        ease: "power2.out",
      })
    }
  }, [scrollProgress])

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect */}
      <div
        ref={glowRef}
        className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(30, 58, 138, 0.6) 0%, rgba(30, 58, 138, 0) 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Outer ring - orbits around */}
      <div
        className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-white/10"
        style={{ animation: "spin 25s linear infinite" }}
      />

      {/* Second ring - orbits in reverse */}
      <div
        className="absolute w-72 h-72 md:w-[22rem] md:h-[22rem] rounded-full border border-white/5"
        style={{ animation: "spin 20s linear infinite reverse" }}
      />

      {/* Logo container - static, no rotation */}
      <div
        ref={logoRef}
        className="relative w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72"
        style={{ willChange: "transform" }}
      >
        <Image
          src={logoUrl}
          alt="Light Alumni Association"
          fill
          className="object-contain drop-shadow-2xl"
          priority
        />
      </div>

      {/* Orbiting dots - these spin around the static logo */}
      <div className="absolute w-80 h-80 md:w-[26rem] md:h-[26rem]" style={{ animation: "spin 15s linear infinite" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/40 rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/40 rounded-full" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />
      </div>
    </div>
  )
}
