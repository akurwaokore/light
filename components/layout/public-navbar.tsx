"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function PublicNavbar() {
  const [siteLogo, setSiteLogo] = useState({ url: "/logo.png", alt: "Light Alumni Association" })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(`/api/cms/settings?key=logo&t=${Date.now()}`)
        if (res.ok) {
          const logoData = await res.json()
          if (logoData) setSiteLogo(logoData)
        }
      } catch (err) {
        console.error("Error loading logo:", err)
      }
    }
    fetchLogo()
  }, [])

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Events", href: "/public-events" },
    { name: "Testimonials", href: "/testimonials" },
    { name: "Videos", href: "/video-gallery" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/20">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={siteLogo.url}
            alt={siteLogo.alt}
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="font-serif text-xl font-semibold text-white">Light Alumni</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild className="text-white hover:bg-white/10">
            <Link href="/dashboard">Sign In</Link>
          </Button>
          <Button asChild className="bg-white text-black hover:bg-white/90">
            <Link href="/dashboard">Join Now</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-white/10 p-4 space-y-4 animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="block text-lg text-white/70 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <Button variant="outline" asChild className="text-white border-white/20">
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>Sign In</Link>
            </Button>
            <Button asChild className="bg-white text-black">
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>Join Now</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
