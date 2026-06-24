"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Briefcase,
  Calendar,
  Heart,
  Globe,
  Star,
  Trophy,
  CreditCard,
  Play,
} from "lucide-react"
import { ScrollIndicator } from "@/components/landing/scroll-indicator"
import { FloatingCard } from "@/components/landing/floating-card"
import { ParticleBackground } from "@/components/landing/particle-background"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Motto } from "@/components/motto"
import { VideoPlayerModal } from "@/components/landing/video-player-modal"
import { PublicNavbar } from "@/components/layout/public-navbar"
import { CmsPageRenderer } from "@/components/cms/page-renderer"
import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHero } from "@/components/layout/public-hero"
import { motion, useScroll, useTransform } from "framer-motion"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const defaultStats = [
  { label: "Active Alumni", value: "12,500+", icon: "Users" },
  { label: "Countries", value: "45+", icon: "Globe" },
  { label: "Career Connections", value: "3,200+", icon: "Briefcase" },
  { label: "Events Hosted", value: "500+", icon: "Calendar" },
]

const iconMap: { [key: string]: any } = {
  Users,
  Briefcase,
  Calendar,
  Heart,
  Globe,
  Star,
  Trophy,
  CreditCard,
}

const defaultFeatures = [
  {
    title: "Professional Networking",
    description: "Connect with alumni across industries and leverage our global network for career opportunities.",
    icon: "Briefcase",
  },
  {
    title: "Exclusive Events",
    description: "Access to reunions, workshops, webinars, and networking events throughout the year.",
    icon: "Calendar",
  },
  {
    title: "Give Back",
    description: "Support current students through scholarships, mentorship programs, and school initiatives.",
    icon: "Heart",
  },
  {
    title: "Member Perks",
    description: "Enjoy exclusive discounts and offers from alumni-owned businesses worldwide.",
    icon: "Star",
  },
  {
    title: "Loyalty Rewards",
    description:
      "Earn points for every marketplace transaction, joining clubs, and community engagement. Compete on the leaderboard for exclusive end-year gifts at our annual alumni party.",
    icon: "Trophy",
  },
  {
    title: "Alumni Card Benefits",
    description:
      "Coming soon: Use your loyalty points with the official alumni card at participating businesses owned by fellow Light Academy graduates worldwide.",
    icon: "CreditCard",
  },
]

const defaultTestimonials = [
  {
    quote: "Light Alumni Connect helped me find my dream job through a fellow alumnus. The network is invaluable!",
    author: "Sarah K.",
    role: "Class of 2012, Product Manager at Google",
  },
  {
    quote: "Being part of this community keeps me connected to my roots while expanding my professional horizons.",
    author: "David O.",
    role: "Class of 2008, CEO at Tech Ventures",
  },
  {
    quote: "The mentorship I received from senior alumni changed my career trajectory completely.",
    author: "Grace W.",
    role: "Class of 2018, Medical Doctor",
  },
]

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [cmsContent, setCmsContent] = useState<{
    hero?: any;
    features?: any;
    testimonials?: any;
    stats?: any;
    video_gallery?: any;
  }>({})
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [homeTree, setHomeTree] = useState<any[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const videoGalleryRef = useRef<HTMLDivElement>(null)

  // Hoisted scroll-parallax hooks. These MUST run on every render (even when the
  // CMS-driven landing takes over below) to respect the Rules of Hooks.
  const { scrollYProgress } = useScroll()
  const heroRotateX = useTransform(scrollYProgress, [0, 0.2], [0, 15])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.6])
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50])

  useEffect(() => {
    // Fetch CMS content
    const fetchCmsContent = async () => {
      try {
        const sectionsRes = await fetch("/api/cms/sections")
        if (sectionsRes.ok) {
          const sections = await sectionsRes.json()
          const contentMap: any = {}
          sections.forEach((section: any) => {
            contentMap[section.section_name] = section.content
          })
          setCmsContent(contentMap)
        }
      } catch (err) {
        console.error("Error loading CMS content:", err)
      }
    }

    fetchCmsContent()

    // If an admin has built a "home" page in the Page Builder, render that instead.
    fetch("/api/cms/builder?slug=home")
      .then((r) => r.json())
      .then((d) => setHomeTree(d.tree || []))
      .catch(() => {})

    // Dynamic import Lenis for smooth scrolling
    import("lenis").then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)

      lenis.on("scroll", () => {
        const progress = Math.min(1, window.scrollY / (document.body.scrollHeight - window.innerHeight))
        setScrollProgress(progress)
      })
    })

    // GSAP animations for features
    if (featuresRef.current) {
      const featureCards = featuresRef.current.querySelectorAll(".feature-card")
      if (featureCards.length > 0) {
      gsap.fromTo(
        featureCards,
        { opacity: 0, y: 100, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        },
      )
      }
    }

    if (testimonialsRef.current) {
      const testimonialCards = testimonialsRef.current.querySelectorAll(".testimonial-card")
      if (testimonialCards.length > 0) {
      gsap.fromTo(
        testimonialCards,
        {
          opacity: 0,
          rotateY: -45,
          z: -200,
        },
        {
          opacity: 1,
          rotateY: 0,
          z: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        },
      )
      }
    }

    if (videoGalleryRef.current) {
      const videoCards = videoGalleryRef.current.querySelectorAll(".video-card")
      if (videoCards.length > 0) {
      gsap.fromTo(
        videoCards,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: videoGalleryRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        },
      )
      }
    }
  }, [])

  const getBackgroundColor = () => {
    const hue = 215 + scrollProgress * 10
    const saturation = 55 + scrollProgress * 15
    const lightness = 12 + scrollProgress * 18
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative"
      style={{ backgroundColor: getBackgroundColor(), transition: "background-color 0.5s ease" }}
    >
      <ParticleBackground />
      <ScrollIndicator />
      <PublicNavbar />

      <div className="relative overflow-hidden perspective-[1000px]">
        <motion.div
          style={{
            rotateX: heroRotateX,
            scale: heroScale,
            opacity: heroOpacity,
            y: heroY,
          }}
          className="origin-top"
        >
          <PublicHero 
            badge={cmsContent.hero?.badge || "Welcome to the future of alumni networking"}
            title={cmsContent.hero?.title || "Where Light Alumni Shine Together"}
            description={cmsContent.hero?.description || "Join the official alumni network of Light Group of Schools. Connect with fellow graduates, advance your career, and give back to the community that shaped you."}
            image={cmsContent.hero?.bg_image}
            scrollProgress={scrollProgress}
          />
        </motion.div>
      </div>

      <section className="relative z-10 py-4 md:py-8 -mt-8">
        <div className="container mx-auto px-4">
          <motion.div
             initial={{ opacity: 0, y: 50 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Motto variant="hero" />
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <FloatingCard>
            <div className="glass-card rounded-3xl border border-white/30 bg-white/10 p-6 md:p-10 backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5)] transition-shadow duration-500">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-6 md:grid-cols-4">
                {(cmsContent.stats?.items || defaultStats).map((stat: any, index: number) => {
                  const IconComponent = iconMap[stat.icon] || Users
                  return (
                    <div key={index} className="text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-110">
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                      <p className="font-serif text-4xl font-bold text-white">{stat.value}</p>
                      <p className="mt-1 text-sm text-white/70">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </FloatingCard>
        </div>
      </section>

      <section id="features" ref={featuresRef} className="relative z-10 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="mx-auto max-w-3xl text-center mb-16 md:mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
            >
              {cmsContent.features?.title || "Everything You Need to Stay Connected"}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-lg md:text-xl text-white/80 px-4 font-light tracking-wide"
            >
              {cmsContent.features?.subtitle || "Our platform offers comprehensive tools to help you network, grow, and give back."}
            </motion.p>
          </div>

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {(cmsContent.features?.items || defaultFeatures).map((feature: any, index: number) => {
              const IconComponent = iconMap[feature.icon] || Briefcase
              return (
                <Card
                  key={index}
                  className="feature-card group glass-card border border-white/10 bg-white/[0.03] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.08] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] hover:border-white/30 rounded-3xl overflow-hidden"
                >
                  <CardContent className="p-8">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:from-blue-500/80 group-hover:to-purple-500/80">
                      <IconComponent className="h-8 w-8 text-white drop-shadow-md" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-white/70 leading-relaxed font-light">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section id="testimonials" ref={testimonialsRef} className="relative z-10 py-20 md:py-28" style={{ perspective: "1000px" }}>
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-white md:text-5xl">
              {cmsContent.testimonials?.title || "Trusted by Alumni Worldwide"}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {(cmsContent.testimonials?.items || defaultTestimonials).map((testimonial: any, index: number) => (
              <Card key={index} className="testimonial-card group glass-card border border-white/20 bg-white/10 backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/20 hover:shadow-2xl">
                <CardContent className="pt-6">
                  <p className="text-white">"{testimonial.quote}"</p>
                  <div className="mt-4 border-t border-white/20 pt-4">
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-white/60">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="video-gallery" ref={videoGalleryRef} className="relative z-10 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-12 md:mb-16">
            <h2 className="font-serif text-4xl font-bold text-white md:text-5xl">
              {cmsContent.video_gallery?.title || "Our Alumni Journey"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
            {(cmsContent.video_gallery?.items && cmsContent.video_gallery.items.length > 0) ? (
              cmsContent.video_gallery.items.map((video: any, index: number) => (
                <div key={index} className="group relative overflow-hidden rounded-3xl cursor-pointer" onClick={() => setSelectedVideo(video)}>
                  <img src={video.image_url || "/placeholder.jpg"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={video.title} />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4"><h3 className="text-white font-semibold">{video.title}</h3></div>
                </div>
              ))
            ) : (
              <>
                <div className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-3xl cursor-pointer" onClick={() => setSelectedVideo({ video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "2024 Graduation Ceremony" })}>
                  <img src="/kenyan-university-graduation-ceremony-students-in-.jpg" className="w-full h-full object-cover" alt="Graduation" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
                      <Play className="h-8 w-8 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4"><h3 className="text-white font-semibold text-xl">2024 Graduation Ceremony</h3></div>
                </div>
                <div className="group relative overflow-hidden rounded-3xl cursor-pointer" onClick={() => setSelectedVideo({ video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Alumni Networking Night" })}>
                  <img src="/african-professionals-networking-event-nairobi-ken.jpg" className="w-full h-full object-cover" alt="Networking" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-3xl cursor-pointer" onClick={() => setSelectedVideo({ video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Alumni Sports Day" })}>
                  <img src="/kenyan-students-playing-football-soccer-sports-day.jpg" className="w-full h-full object-cover" alt="Sports" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-10">
        <PublicFooter />
      </div>

      {selectedVideo && <VideoPlayerModal video={selectedVideo} isOpen={!!selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  )
}
