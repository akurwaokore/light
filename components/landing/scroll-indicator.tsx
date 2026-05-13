"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import gsap from "gsap"

export function ScrollIndicator() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY < 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const icon = document.querySelector(".scroll-indicator-icon")
    if (!icon) return

    gsap.to(icon, {
      y: 10,
      duration: 1,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
    })
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 animate-bounce">
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-white/70">Scroll to explore</span>
        <div className="scroll-indicator-icon rounded-full border border-white/30 bg-white/10 p-2 backdrop-blur-sm">
          <ChevronDown className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}
