"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface AnimatedTextProps {
  text: string
  className?: string
}

export function AnimatedText({ text, className = "" }: AnimatedTextProps) {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!textRef.current) return

    const words = textRef.current.querySelectorAll(".word")
    if (!words.length) return

    gsap.fromTo(
      words,
      {
        opacity: 0,
        y: 50,
        rotateX: -90,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      },
    )
  }, [])

  const words = text.split(" ")

  return (
    <div ref={textRef} className={className} style={{ perspective: "1000px" }}>
      {words.map((word, index) => (
        <span key={index} className="word inline-block" style={{ transformStyle: "preserve-3d" }}>
          {word}
          {index < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </div>
  )
}
