"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { FOOTER_DEFAULTS } from "@/lib/page-defaults"

type FooterContent = typeof FOOTER_DEFAULTS

/** Deep-merge stored footer content over the defaults (arrays replace whole). */
function deepMerge<T>(base: T, override: any): T {
  if (Array.isArray(override)) return override as T
  if (override && typeof override === "object" && base && typeof base === "object" && !Array.isArray(base)) {
    const out: any = { ...base }
    for (const key of Object.keys(override)) out[key] = deepMerge((base as any)[key], override[key])
    return out
  }
  return (override === undefined ? base : override) as T
}

const SOCIAL_ICONS = { facebook: Facebook, twitter: Twitter, instagram: Instagram, linkedin: Linkedin } as const

// Shared front-end footer: 4 columns, red background, white text.
// Content is editable in Admin → CMS → Footer (stored as the `footer` section).
// Used on all public pages (landing, CMS pages, events, etc.).
export function PublicFooter() {
  const year = new Date().getFullYear()
  const [content, setContent] = useState<FooterContent>(FOOTER_DEFAULTS)

  useEffect(() => {
    let active = true
    fetch(`/api/cms/sections?name=footer`)
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        if (active && row?.content) setContent((prev) => deepMerge(prev, row.content))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const { brand, social, columns, contact, copyright, bottom_links } = content

  return (
    <footer className="bg-red-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Brand / about */}
          <div>
            <h3 className="font-serif text-xl font-bold">{brand.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/80">{brand.description}</p>
            <div className="mt-4 flex gap-3">
              {(Object.keys(SOCIAL_ICONS) as Array<keyof typeof SOCIAL_ICONS>).map((key) => {
                const href = (social as any)?.[key]
                if (!href) return null
                const Icon = SOCIAL_ICONS[key]
                return (
                  <a
                    key={key}
                    href={href}
                    aria-label={key}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">{columns.explore.title}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {columns.explore.links.map((link, i) => (
                <li key={i}><Link href={link.href} className="hover:text-white">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Community */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">{columns.community.title}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {columns.community.links.map((link, i) => (
                <li key={i}><Link href={link.href} className="hover:text-white">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Get in touch */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">{contact.title}</h4>
            <ul className="space-y-3 text-sm text-white/80">
              {contact.email && (
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /><a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a></li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>{contact.phone}</span></li>
              )}
              {contact.address && (
                <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4" /><span>{contact.address}</span></li>
              )}
            </ul>
            {contact.cta?.label && (
              <Link href={contact.cta.href} className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-white/90">
                {contact.cta.label}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-white/70 sm:flex-row">
          <p>© {year} {copyright}</p>
          <div className="flex gap-4">
            {bottom_links.map((link, i) => (
              <Link key={i} href={link.href} className="hover:text-white">{link.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
