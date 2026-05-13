"use client"

import { useRef, useState } from "react"
import { Instagram, ExternalLink } from "lucide-react"

interface InstagramEmbedProps {
  postUrl: string
  title: string
}

export function InstagramEmbed({ postUrl, title }: InstagramEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <a
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative h-full w-full cursor-pointer overflow-hidden group block"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-pink-500/30 to-orange-500/30">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Instagram icon and content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/60 bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-125 mb-4">
          <Instagram className="h-8 w-8 text-white" />
        </div>
        <p className="text-white/80 text-sm text-center">View on Instagram</p>
      </div>

      {/* Title overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 backdrop-blur-sm">
        <h3 className="font-serif text-lg font-semibold text-white text-pretty flex items-center gap-2">
          {title}
          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
      </div>

      {/* Border effect on hover */}
      <div className="absolute inset-0 border-2 border-white/0 transition-colors duration-300 group-hover:border-white/30 rounded-3xl pointer-events-none" />
    </a>
  )
}
