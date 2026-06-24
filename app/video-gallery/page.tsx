"use client"

import { useState, useEffect } from "react"
import { PublicNavbar } from "@/components/layout/public-navbar"
import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHero } from "@/components/layout/public-hero"
import { Play } from "lucide-react"
import { VideoPlayerModal } from "@/components/landing/video-player-modal"

export default function VideoGalleryPage() {
  const [cmsContent, setCmsContent] = useState<any>({})
  const [selectedVideo, setSelectedVideo] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/cms/sections")
        if (res.ok) {
          const sections = await res.json()
          const gallery = sections.find((s: any) => s.section_name === 'video_gallery')
          const hero = sections.find((s: any) => s.section_name === 'hero')
          setCmsContent({ gallery: gallery?.content || {}, hero: hero?.content || {} })
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PublicNavbar />
      <PublicHero 
        badge="Memorable Moments"
        title={cmsContent.gallery?.title || "Video Gallery"}
        description={cmsContent.gallery?.subtitle || "Relive the best moments from our alumni events and reunions."}
        image={cmsContent.hero?.bg_image}
        showLogo={true}
      />
      
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[250px] grid-flow-dense">
          {(cmsContent.gallery?.items && cmsContent.gallery.items.length > 0) ? (
            cmsContent.gallery.items.map((video: any, index: number) => (
              <div 
                key={index} 
                className={`group relative overflow-hidden rounded-3xl cursor-pointer border border-white/10 ${
                  video.size === 'wide' ? 'md:col-span-2' : 
                  video.size === 'tall' ? 'md:row-span-2' : 
                  video.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''
                }`}
                onClick={() => setSelectedVideo(video)}
              >
                <img src={video.image_url || "/placeholder.jpg"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={video.title} />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-all">
                    <Play className="h-6 w-6 text-white fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold line-clamp-1">{video.title}</h3>
                  {video.subtitle && <p className="text-white/60 text-xs mt-1 line-clamp-1">{video.subtitle}</p>}
                </div>
              </div>
            ))
          ) : (
            /* Fallback default videos for Gallery page */
            <>
              <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl cursor-pointer border border-white/10" onClick={() => setSelectedVideo({ video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "2024 Graduation Ceremony" })}>
                <img src="/kenyan-university-graduation-ceremony-students-in-.jpg" className="w-full h-full object-cover" alt="Graduation" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4"><h3 className="text-white font-semibold text-xl font-serif">2024 Graduation Ceremony</h3></div>
              </div>
              <div className="group relative overflow-hidden rounded-3xl cursor-pointer border border-white/10" onClick={() => setSelectedVideo({ video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Alumni Networking Night" })}>
                <img src="/african-professionals-networking-event-nairobi-ken.jpg" className="w-full h-full object-cover" alt="Networking" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-8 w-8 text-white fill-white" /></div>
                <div className="absolute bottom-4 left-4"><h3 className="text-white font-semibold">Alumni Networking</h3></div>
              </div>
              <div className="group relative overflow-hidden rounded-3xl cursor-pointer border border-white/10" onClick={() => setSelectedVideo({ video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Alumni Sports Day" })}>
                <img src="/kenyan-students-playing-football-soccer-sports-day.jpg" className="w-full h-full object-cover" alt="Sports" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-8 w-8 text-white fill-white" /></div>
                <div className="absolute bottom-4 left-4"><h3 className="text-white font-semibold">Sports Day</h3></div>
              </div>
              <div className="group relative overflow-hidden rounded-3xl cursor-pointer border border-white/10" onClick={() => setSelectedVideo({ video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Career Workshop" })}>
                <img src="/african-professional-giving-presentation-career-wo.jpg" className="w-full h-full object-cover" alt="Career" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-8 w-8 text-white fill-white" /></div>
                <div className="absolute bottom-4 left-4"><h3 className="text-white font-semibold">Career Workshop</h3></div>
              </div>
              <div className="group relative overflow-hidden rounded-3xl cursor-pointer border border-white/10" onClick={() => setSelectedVideo({ video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Gala Dinner" })}>
                <img src="/elegant-african-gala-dinner-event-formal-attire-ke.jpg" className="w-full h-full object-cover" alt="Gala" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-8 w-8 text-white fill-white" /></div>
                <div className="absolute bottom-4 left-4"><h3 className="text-white font-semibold">Alumni Gala</h3></div>
              </div>
            </>
          )}
        </div>
      </div>

      <PublicFooter />

      {selectedVideo && <VideoPlayerModal video={selectedVideo} isOpen={!!selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  )
}
