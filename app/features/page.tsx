"use client"

import { useState, useEffect } from "react"
import { PublicNavbar } from "@/components/layout/public-navbar"
import { PublicHero } from "@/components/layout/public-hero"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Calendar, Heart, Star, Trophy, CreditCard } from "lucide-react"

export default function FeaturesPage() {
  const [cmsContent, setCmsContent] = useState<any>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/cms/sections")
        if (res.ok) {
          const sections = await res.json()
          const features = sections.find((s: any) => s.section_name === 'features')
          const hero = sections.find((s: any) => s.section_name === 'hero')
          setCmsContent({ features: features?.content || {}, hero: hero?.content || {} })
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  const iconMap: { [key: string]: any } = { Briefcase, Calendar, Heart, Star, Trophy, CreditCard }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PublicNavbar />
      <PublicHero 
        badge="Tailored for Graduates"
        title={cmsContent.features?.title || "Platform Features"}
        description={cmsContent.features?.subtitle || "Explore the tools and benefits designed for our alumni community."}
        image={cmsContent.hero?.bg_image}
        showLogo={true}
      />
      
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cmsContent.features?.items?.map((feature: any, index: number) => {
            const Icon = iconMap[feature.icon] || Briefcase
            return (
              <Card key={index} className="bg-white/5 border-white/10 hover:border-blue-500/50 transition-all">
                <CardContent className="pt-8 text-center">
                  <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-4 text-white">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
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
