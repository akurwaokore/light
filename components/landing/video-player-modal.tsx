"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Play } from "lucide-react"

interface VideoPlayerModalProps {
  video: {
    title: string
    video_url?: string
    image_url?: string
  }
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayerModal({ video, isOpen, onClose }: VideoPlayerModalProps) {
  // Extract YouTube ID
  const getYoutubeId = (url?: string) => {
    if (!url) return null
    // Enhanced regex to handle more YouTube URL formats including shorts
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)\??v?=?|shorts\/)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[7].length === 11) ? match[7] : null
  }

  const youtubeId = getYoutubeId(video.video_url)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black border-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{video.title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full">
          {youtubeId ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center">
              <Play className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
              <p className="text-white/60">No valid video URL provided for this item.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
