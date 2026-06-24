import Link from "next/link"
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

// Shared front-end footer: 4 columns, red background, white text.
// Used on all public pages (landing, CMS pages, events, etc.).
export function PublicFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-red-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Brand / about */}
          <div>
            <h3 className="font-serif text-xl font-bold">Light Alumni Network</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              The official alumni community of Light Group of Schools. Reconnect with classmates,
              grow your career, give back, and stay part of the family — for life.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Facebook" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Facebook className="h-4 w-4" /></a>
              <a href="#" aria-label="Twitter" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Twitter className="h-4 w-4" /></a>
              <a href="#" aria-label="Instagram" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Instagram className="h-4 w-4" /></a>
              <a href="#" aria-label="LinkedIn" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Linkedin className="h-4 w-4" /></a>
            </div>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">Explore</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/feed" className="hover:text-white">Community Feed</Link></li>
              <li><Link href="/events" className="hover:text-white">Events</Link></li>
              <li><Link href="/marketplace" className="hover:text-white">Marketplace</Link></li>
              <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
            </ul>
          </div>

          {/* Column 3 — Community */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">Community</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/members" className="hover:text-white">Member Directory</Link></li>
              <li><Link href="/clubs" className="hover:text-white">Clubs & Groups</Link></li>
              <li><Link href="/giving" className="hover:text-white">Giving Back</Link></li>
              <li><Link href="/perks" className="hover:text-white">Member Perks</Link></li>
              <li><Link href="/newsletter" className="hover:text-white">Newsletter</Link></li>
            </ul>
          </div>

          {/* Column 4 — Get in touch */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /><a href="mailto:alumni@lightschools.ac.ke" className="hover:text-white">alumni@lightschools.ac.ke</a></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>+254 700 000 000</span></li>
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4" /><span>Light Group of Schools, Nairobi, Kenya</span></li>
            </ul>
            <Link href="/auth/signup" className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-white/90">
              Join the network
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-white/70 sm:flex-row">
          <p>© {year} Light Alumni Network. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/feed" className="hover:text-white">Community</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
