"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CreateClubDialog } from "@/components/admin/clubs/create-club-dialog"
import {
  Search,
  Users,
  Laptop,
  HeartPulse,
  Rocket,
  BookOpen,
  Dumbbell,
  Palette,
  MapPin,
  GraduationCap,
  Globe,
  Calendar,
  Mail,
  ArrowRight,
  Plus,
  Award,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  laptop: Laptop,
  "heart-pulse": HeartPulse,
  rocket: Rocket,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  palette: Palette,
  "map-pin": MapPin,
  "graduation-cap": GraduationCap,
}

const categoryColors = {
  professional: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  interest: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  regional: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  batch: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
}

const regionColors = {
  africa: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  europe: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  americas: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  asia: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

// Helper to determine region from name for the header summary
const getRegionFromName = (name: string): keyof typeof regionColors => {
  const n = name.toLowerCase()
  if (n.includes("nairobi") || n.includes("mombasa") || n.includes("africa")) return "africa"
  if (n.includes("united kingdom") || n.includes("europe") || n.includes("london") || n.includes("berlin")) return "europe"
  if (n.includes("united states") || n.includes("americas") || n.includes("new york")) return "americas"
  if (n.includes("malaysia") || n.includes("asia") || n.includes("kuala lumpur")) return "asia"
  return "africa"
}

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [joinedClubs, setJoinedClubs] = useState<string[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [userId, setUserId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/clubs")
      const data = await response.json()
      if (data.clubs) {
        setClubs(data.clubs)
      }
      if (data.userMemberships) {
        setJoinedClubs(data.userMemberships)
      }
      if (data.userId) {
        setUserId(data.userId)
      }
    } catch (error) {
      console.error("[Clubs] Error fetching clubs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClubs = clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleJoinClub = async (clubId: string) => {
    const isJoining = !joinedClubs.includes(clubId)
    
    // Optimistic UI
    setJoinedClubs(prev => isJoining ? [...prev, clubId] : prev.filter(id => id !== clubId))

    try {
      const response = await fetch("/api/clubs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.action === "left") {
          toast({
            title: "Left club",
            description: "You've left the club.",
          })
        } else {
          toast({
            title: "Joined club! 🎉",
            description: `You earned ${data.pointsAwarded || 5} points for joining!`,
          })
        }
        fetchClubs() // Sync actual state
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      // Revert optimistic UI
      setJoinedClubs(prev => isJoining ? prev.filter(id => id !== clubId) : [...prev, clubId])
      console.error("[Clubs] Error toggling club membership:", error)
      toast({
        title: "Error",
        description: "Failed to update membership. Please try again.",
        variant: "destructive",
      })
    }
  }

  const ClubCard = ({ club }: { club: any }) => {
    const Icon = iconMap[club.icon] || Users
    const isJoined = joinedClubs.includes(club.id)

    const perks = [
      "Exclusive networking events",
      "Priority access to resources",
      "Special community badges"
    ]

    return (
      <Card className="flex flex-col h-full transition-all hover:border-primary/50 hover:shadow-md border-muted/60 bg-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <Badge variant="secondary" className={`${categoryColors[club.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"} text-[10px] px-2 py-0 uppercase font-semibold tracking-wider`}>
              {club.category || "General"}
            </Badge>
          </div>
          <CardTitle className="mt-4 font-serif text-lg leading-tight">{club.name}</CardTitle>
          <CardDescription className="line-clamp-2 text-xs mt-1 leading-relaxed">{club.description}</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto pt-4 space-y-4">
          {isJoined && (
            <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                <Award className="h-3 w-3" /> Member Perks
              </p>
              <ul className="space-y-1">
                {perks.map((perk, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-primary/40" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{club.members_count || 0} members</span>
            </div>
            <div className="flex items-center gap-2">
              {!isJoined && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mr-1">
                  <Award className="h-3 w-3 text-amber-500" />
                  +5 pts
                </div>
              )}
              <Button
                variant={isJoined ? "outline" : "default"}
                size="sm"
                className={`h-8 px-4 text-xs font-semibold rounded-md ${!isJoined ? "bg-[#1e3a8a] hover:bg-[#1e3a8a]/90" : ""}`}
                onClick={() => handleJoinClub(club.id)}
              >
                {isJoined ? "Joined" : "Join"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const LocationChapterCard = ({ cluster }: { cluster: any }) => {
    const isJoined = joinedClubs.includes(cluster.id)
    const region = getRegionFromName(cluster.name)

    const perks = [
      "Regional meetup invitations",
      "Local alumni directory access",
      "Chapter-exclusive discussions"
    ]

    return (
      <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg border-muted/60 h-full flex flex-col">
        <div className="relative h-44 w-full">
          <Image 
            src={cluster.image_url || "/placeholder.svg"} 
            alt={cluster.name} 
            fill 
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge variant="secondary" className={`${regionColors[region]} mb-2 text-[10px] px-2 py-0 uppercase font-semibold tracking-wider`}>
              {region}
            </Badge>
            <h3 className="font-serif text-xl font-bold text-white leading-tight">{cluster.name}</h3>
            <p className="text-xs text-white/80 mt-1">
              {cluster.name.split(" ")[0]}, {region === "africa" ? "Kenya" : region === "europe" ? "UK/Europe" : "International"}
            </p>
          </div>
        </div>
        <CardContent className="p-5 flex flex-col flex-1">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">{cluster.description}</p>

          {isJoined && (
            <div className="mb-6 rounded-lg bg-primary/5 p-3 border border-primary/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                <Award className="h-3 w-3" /> Chapter Perks
              </p>
              <div className="grid grid-cols-1 gap-1">
                {perks.map((perk, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-primary/40" />
                    {perk}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Users className="h-4 w-4" />
                <span>{cluster.members_count} members</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Calendar className="h-4 w-4" />
                <span>Dec 15</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isJoined ? "outline" : "default"}
                size="sm"
                className={`flex-1 h-9 font-semibold rounded-md ${!isJoined ? "bg-[#1e3a8a] hover:bg-[#1e3a8a]/90" : ""}`}
                onClick={() => handleJoinClub(cluster.id)}
              >
                {isJoined ? "Joined" : "Join Chapter"}
              </Button>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-md">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Live Aggregations for Header
  const regions = ["africa", "europe", "americas", "asia"] as const
  const regionalData = regions.map(region => {
    const chapters = clubs.filter(c => c.category === "regional" && getRegionFromName(c.name) === region)
    const members = chapters.reduce((sum, c) => sum + (c.members_count || 0), 0)
    return { region, members, chapterCount: chapters.length }
  })

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-10 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Clubs & Groups</h1>
          <p className="mt-1 text-muted-foreground">Join interest-based groups and connect with like-minded alumni</p>
        </div>
        <Button 
          className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 px-6 font-semibold"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Club
          <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-none text-[10px]">
            +15 pts at 10 members
          </Badge>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clubs and chapters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-card border-muted/60"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-8">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-6">
          <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 text-sm font-medium">All Clubs</TabsTrigger>
          <TabsTrigger value="my-clubs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 text-sm font-medium">My Clubs ({joinedClubs.length})</TabsTrigger>
          <TabsTrigger value="location" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 text-sm font-medium flex items-center gap-1.5">
            <Globe className="h-4 w-4" />
            Location Chapters
          </TabsTrigger>
          <TabsTrigger value="professional" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 text-sm font-medium">Professional</TabsTrigger>
          <TabsTrigger value="interest" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 text-sm font-medium">Interest</TabsTrigger>
        </TabsList>

        <TabsContent value="location" className="space-y-10 focus-visible:outline-none">
          <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 to-accent/5 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold">Global Alumni Network</h2>
                <p className="text-sm text-muted-foreground">Connect with alumni in your region</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {regionalData.map(({ region, members, chapterCount }) => (
                <div key={region} className="rounded-xl border border-muted/40 bg-card p-4 text-center shadow-sm">
                  <Badge variant="secondary" className={`${regionColors[region]} text-[10px] uppercase font-bold tracking-wider`}>
                    {region}
                  </Badge>
                  <p className="mt-3 text-2xl font-bold text-foreground">{members.toLocaleString()}</p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                    {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.filter(c => c.category === "regional").map((cluster) => (
              <LocationChapterCard key={cluster.id} cluster={cluster} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-12 focus-visible:outline-none">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold flex items-center gap-2 text-foreground">
                <Globe className="h-5 w-5 text-[#1e3a8a]" />
                Location Chapters
              </h2>
              <Button variant="ghost" size="sm" className="text-[#1e3a8a] font-semibold hover:bg-[#1e3a8a]/5">
                View All <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClubs.filter(c => c.category === "regional").slice(0, 3).map((cluster) => (
                <LocationChapterCard key={cluster.id} cluster={cluster} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-6 text-foreground">Interest-Based Groups</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredClubs.filter(c => c.category !== "regional").map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="my-clubs" className="focus-visible:outline-none">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your clubs...</p>
            </div>
          ) : joinedClubs.length > 0 ? (
            <div className="space-y-12">
              {filteredClubs.filter(c => joinedClubs.includes(c.id) && c.category === "regional").length > 0 && (
                <section>
                  <h2 className="font-serif text-xl font-bold mb-6 text-foreground">My Location Chapters</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredClubs
                      .filter((c) => joinedClubs.includes(c.id) && c.category === "regional")
                      .map((cluster) => (
                        <LocationChapterCard key={cluster.id} cluster={cluster} />
                      ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="font-serif text-xl font-bold mb-6 text-foreground">My Interest Groups</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredClubs
                    .filter((club) => joinedClubs.includes(club.id) && club.category !== "regional")
                    .map((club) => (
                      <ClubCard key={club.id} club={club} />
                    ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
              <Users className="mx-auto h-14 w-14 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-bold">No clubs joined yet</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2 text-sm">Explore and join chapters or interest groups to connect with fellow alumni.</p>
              <Button variant="outline" className="mt-6 font-semibold" onClick={() => document.querySelector('[data-value="all"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}>
                Explore All Clubs
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="professional" className="focus-visible:outline-none">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredClubs
              .filter((club) => club.category === "professional")
              .map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="interest" className="focus-visible:outline-none">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredClubs
              .filter((club) => club.category === "interest")
              .map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {!isLoading && filteredClubs.length === 0 && (
        <div className="py-20 text-center">
          <Users className="mx-auto h-14 w-14 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-bold text-muted-foreground">No clubs found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search terms</p>
        </div>
      )}

      <CreateClubDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchClubs}
        userId={userId}
      />
    </div>
  )
}
