"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import gsap from "gsap"

interface FloatingCardProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FloatingCard({ children, delay = 0, className = "" }: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return

    gsap.to(cardRef.current, {
      y: -20,
      duration: 2,
      delay,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
    })
  }, [delay])

  return (
    <div ref={cardRef} className={className}>
      {children}
    </div>
  )
}
