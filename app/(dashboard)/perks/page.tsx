"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Tag, User, ExternalLink } from "lucide-react"
import { BecomePartnerModal } from "@/components/perks/become-partner-modal"

const categoryColors: Record<string, string> = {
  Automotive: "bg-blue-100 text-blue-800",
  Legal: "bg-purple-100 text-purple-800",
  Photography: "bg-pink-100 text-pink-800",
  "Business Services": "bg-green-100 text-green-800",
  Marketing: "bg-cyan-100 text-cyan-800",
  Travel: "bg-amber-100 text-amber-800",
  "Health & Fitness": "bg-emerald-100 text-emerald-800",
  Shopping: "bg-rose-100 text-rose-800",
  Services: "bg-indigo-100 text-indigo-800",
}

interface Perk {
  id: string
  business: string
  description: string | null
  discount: string
  category: string
  logoURL: string | null
  owner: string
}

export default function PerksPage() {
  const [perks, setPerks] = useState<Perk[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPerks = async () => {
    try {
      const res = await fetch("/api/perks")
      const data = await res.json()
      setPerks(data.perks || [])
    } catch {
      setPerks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerks()
  }, [])

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Member Perks</h1>
        <p className="mt-1 text-muted-foreground">Exclusive discounts and offers from alumni-owned businesses</p>
      </div>

      {/* Featured Banner */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center md:flex-row md:text-left">
          <div className="rounded-full bg-primary-foreground/20 p-4">
            <Gift className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-bold">Exclusive Alumni Benefits</h2>
            <p className="mt-1 text-primary-foreground/80">
              Show your digital membership card to unlock special discounts at these alumni-owned businesses
            </p>
          </div>
          <Button variant="secondary">View Membership Card</Button>
        </CardContent>
      </Card>

      {/* Perks Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : perks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No perks available yet. Be the first to{" "}
            <span className="font-medium text-foreground">become a partner</span> below.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {perks.map((perk) => (
            <Card key={perk.id} className="transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {perk.logoURL ? (
                      <img
                        src={perk.logoURL || "/placeholder.svg"}
                        alt={perk.business}
                        className="h-14 w-14 rounded object-contain"
                      />
                    ) : (
                      <Tag className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <Badge variant="secondary" className={categoryColors[perk.category] || "bg-gray-100 text-gray-800"}>
                    {perk.category}
                  </Badge>
                </div>
                <CardTitle className="mt-3 font-serif text-lg">{perk.business}</CardTitle>
                <CardDescription>{perk.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-accent/10 p-3 text-center">
                  <p className="text-sm text-muted-foreground">Exclusive Offer</p>
                  <p className="font-serif text-lg font-bold text-accent">{perk.discount}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{perk.owner}</span>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Become a Partner */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold">Own a Business?</h3>
            <p className="mt-1 text-muted-foreground">List your business and offer exclusive perks to fellow alumni</p>
          </div>
          <BecomePartnerModal onSubmitted={fetchPerks}>
            <Button>Become a Partner</Button>
          </BecomePartnerModal>
        </CardContent>
      </Card>
    </div>
  )
}
