"use client"

import { useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface ConnectedGalleryItem {
  image_url: string
  alt?: string
}

interface ConnectedGalleryProps {
  items: ConnectedGalleryItem[]
}

export function ConnectedGallery({ items }: ConnectedGalleryProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const slides = useMemo(
    () => items.filter((item) => item?.image_url).slice(0, 7),
    [items],
  )

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current || slides.length <= 1) return

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".connected-gallery-panel")
      if (panels.length <= 1) return

      gsap.to(trackRef.current, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerWidth * (panels.length - 1)}`,
          pin: true,
          scrub: 0.9,
          snap: {
            snapTo: 1 / (panels.length - 1),
            duration: { min: 0.12, max: 0.28 },
            ease: "power1.inOut",
          },
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [slides.length])

  if (slides.length === 0) return null

  return (
    <section ref={sectionRef} className="relative mt-12 h-screen overflow-hidden rounded-[32px] border border-white/10 bg-[#ebe1d2] shadow-[0_25px_80px_-35px_rgba(0,0,0,0.45)]">
      <div className="flex h-full" ref={trackRef} style={{ width: `${slides.length * 100}%` }}>
        {slides.map((item, index) => (
          <div
            key={`${item.image_url}-${index}`}
            className="connected-gallery-panel relative h-full w-full shrink-0 overflow-hidden"
          >
            <div className="absolute inset-y-0 left-0 w-full bg-[#ebe1d2]" style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)" }} />
            <div className="absolute inset-y-0 left-[7%] w-px bg-emerald-400/60" />
            <div className="absolute inset-y-0 right-[7%] w-px bg-emerald-400/60" />
            <div className="absolute inset-4 overflow-hidden rounded-[28px] border border-black/5 bg-black/10 shadow-inner sm:inset-8">
              <Image
                src={item.image_url}
                alt={item.alt || `Connected gallery image ${index + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-center backdrop-blur-md">
              <span className="font-serif text-lg text-white sm:text-xl">{String(index + 1).padStart(2, "0")}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
