"use client"

import { useRef, useState } from "react"
import { Play } from "lucide-react"

interface VideoCardProps {
  src: string
  title: string
}

export function VideoCard({ src, title }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  return (
    <div
      className="relative h-full w-full cursor-pointer overflow-hidden group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video element - using placeholder as poster */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20">
        <img
          src={src || "/placeholder.svg"}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      {/* Glassmorphic overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isPlaying ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/60 bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-125">
          <Play className="h-8 w-8 fill-white text-white" />
        </div>
      </div>

      {/* Title overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 backdrop-blur-sm">
        <h3 className="font-serif text-lg font-semibold text-white text-pretty">{title}</h3>
      </div>

      {/* Border effect on hover */}
      <div className="absolute inset-0 border-2 border-white/0 transition-colors duration-300 group-hover:border-white/30 rounded-3xl pointer-events-none" />
    </div>
  )
}
