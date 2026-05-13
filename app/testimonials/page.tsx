"use client"

import { useState, useEffect } from "react"
import { PublicNavbar } from "@/components/layout/public-navbar"
import { PublicHero } from "@/components/layout/public-hero"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

export default function TestimonialsPage() {
  const [cmsContent, setCmsContent] = useState<any>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/cms/sections")
        if (res.ok) {
          const sections = await res.json()
          const testimonials = sections.find((s: any) => s.section_name === 'testimonials')
          const hero = sections.find((s: any) => s.section_name === 'hero')
          setCmsContent({ testimonials: testimonials?.content || {}, hero: hero?.content || {} })
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
        badge="Community Voices"
        title={cmsContent.testimonials?.title || "Success Stories"}
        description={cmsContent.testimonials?.subtitle || "Hear from our alumni about how the Light Alumni Network has shaped their journeys."}
        image={cmsContent.hero?.bg_image}
        showLogo={true}
      />
      
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cmsContent.testimonials?.items?.map((t: any, index: number) => (
            <Card key={index} className="bg-white/5 border-white/10 hover:border-blue-500/50 transition-all flex flex-col">
              <CardContent className="pt-8 flex flex-col h-full">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg italic text-slate-200 mb-8 flex-1">"{t.quote}"</p>
                <div className="border-t border-white/10 pt-6">
                  <p className="font-serif font-bold text-white text-lg">{t.author}</p>
                  <p className="text-blue-400 text-sm">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/10 bg-black/30 py-12 text-center text-white/60">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Light Group of Schools</p>
        </div>
      </footer>
    </div>
  )
}
