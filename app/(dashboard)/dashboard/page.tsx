"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserListings } from "@/components/dashboard/user-listings"
import { Motto } from "@/components/motto"
import { SocialFeedWidget } from "@/components/feed/social-feed-widget"
import { Skeleton } from "@/components/ui/skeleton"
import {
  User,
  Users,
  Calendar,
  Gift,
  Briefcase,
  ArrowRight,
  Heart,
  ShoppingBag,
  Wrench,
  FileText,
  Loader2,
  Trophy,
  Star,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Bell,
  Clock,
} from "lucide-react"

const quickActions = [
  {
    title: "My Profile",
    description: "View and edit your profile",
    icon: User,
    href: "/profile",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "Join Clubs",
    description: "Connect with interest groups",
    icon: Users,
    href: "/clubs",
    color: "bg-green-500/10 text-green-600",
  },
  {
    title: "Upcoming Events",
    description: "RSVP to alumni events",
    icon: Calendar,
    href: "/events",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    title: "Member Perks",
    description: "Exclusive discounts",
    icon: Gift,
    href: "/perks",
    color: "bg-orange-500/10 text-orange-600",
  },
]

import { useProfile } from "@/hooks/use-profile"

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [loading, setLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState<{
    points: string
    rank: number | null
    milestone: number
  }>({
    points: "0",
    rank: null,
    milestone: 1000, // Default milestone
  })

  useEffect(() => {
    let mounted = true
    setHasMounted(true)
    
    if (profile && !profileLoading) {
      const fetchData = async () => {
        try {
          // Fetch points and events in parallel
          const [pointsRes, eventsRes] = await Promise.all([
            fetch(`/api/points/current`),
            fetch('/api/events?status=approved')
          ])

          if (pointsRes.ok) {
            const pointsData = await pointsRes.json()
            if (mounted && pointsData) setLoyaltyPoints({
              ...pointsData,
              milestone: pointsData.milestone || 1000
            })
          }

          if (eventsRes.ok) {
            const eventsData = await eventsRes.json()
            if (mounted) setUpcomingEvents(eventsData.slice(0, 3))
          }
        } catch (err) {
          console.error("Failed to load dashboard data:", err)
        } finally {
          if (mounted) setLoading(false)
        }
      }
      fetchData()
    } else if (!profileLoading && !profile) {
       // Only redirect if explicitly not loading and no profile found
       window.location.href = "/auth/signin"
    }

    return () => { mounted = false }
  }, [profile, profileLoading])

  if (!hasMounted || loading) {
    return (
      <div className="container mx-auto space-y-8 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-12 w-32 rounded-2xl" />
            <Skeleton className="h-12 w-32 rounded-2xl" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-[600px] rounded-3xl" />
          <Skeleton className="h-[600px] rounded-3xl" />
        </div>
      </div>
    )
  }

  const firstName = profile?.display_name?.split(" ")[0] || "there"
  const pointsNum = parseInt(loyaltyPoints.points) || 0
  const progress = Math.min(100, (pointsNum / loyaltyPoints.milestone) * 100)

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-700">
      {profile?.isAdmin && (
        <Alert className="glass-strong border-primary/20 bg-primary/5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className="font-medium">Admin Access Active</span>
            <Button variant="link" size="sm" asChild className="text-primary font-bold">
              <Link href="/admin">Enter Admin Panel <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome, <span className="text-primary">{firstName}</span>!
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening in your alumni community today.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="px-4 py-1.5 rounded-full glass-strong border-primary/20 text-primary font-semibold">
            {profile.membership_tier?.toUpperCase() || "FREE"} MEMBER
          </Badge>
          <Button variant="outline" size="sm" className="rounded-full glass" asChild>
            <Link href="/profile"><User className="mr-2 h-4 w-4" /> Edit Profile</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
          
          <Motto variant="dashboard" />

          {/* Points & Progress Widget */}
          <Card className="glass-strong border-amber-500/20 shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="h-24 w-24 text-amber-600 rotate-12" />
            </div>
            <CardContent className="p-6 md:p-8 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">Loyalty Rewards</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold font-serif text-amber-700 dark:text-amber-400">
                      {loyaltyPoints.points}
                    </span>
                    <span className="text-muted-foreground font-medium">Points Earned</span>
                  </div>
                </div>
                
                <div className="flex-1 max-w-md space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Next Milestone: {loyaltyPoints.milestone} pts</span>
                    <span className="text-amber-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 w-full bg-amber-500/10 rounded-full overflow-hidden border border-amber-500/10">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Keep engaging to unlock exclusive end-year gifts!
                  </p>
                </div>

                <Button className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white rounded-2xl shadow-lg shadow-amber-600/20" asChild>
                  <Link href="/leaderboard">View Leaderboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="group">
                <Card className="glass h-full border-primary/10 transition-all hover:border-primary/40 hover:translate-y-[-4px]">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <div className={`rounded-2xl p-3 ${action.color} group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{action.title}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Social Feed Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Community Feed
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/feed">View Full Feed <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <SocialFeedWidget profile={profile} />
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Career & Commerce Card */}
          <Card className="glass-strong border-primary/20 overflow-hidden">
             <div className="bg-primary/5 border-b border-primary/10 p-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Opportunities Hub
                </h3>
             </div>
             <CardContent className="p-4 space-y-4">
                <Link href="/marketplace?action=add-product" className="block p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Sell Product</p>
                        <p className="text-xs text-muted-foreground">List items in marketplace</p>
                      </div>
                   </div>
                </Link>
                <Link href="/marketplace?action=add-service" className="block p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-xl text-purple-500 group-hover:scale-110 transition-transform">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Offer Service</p>
                        <p className="text-xs text-muted-foreground">Share your expertise</p>
                      </div>
                   </div>
                </Link>
                <Link href="/careers" className="block p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Career Center</p>
                        <p className="text-xs opacity-80">Jobs & Applications</p>
                      </div>
                   </div>
                </Link>
             </CardContent>
          </Card>

          {/* Upcoming Events Card */}
          <Card className="glass border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif">Upcoming Events</CardTitle>
              <CardDescription>Don't miss out</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`} className="block group">
                      <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0 border border-primary/20">
                          <span className="text-[10px] font-bold text-primary uppercase">
                            {new Date(event.date).toLocaleString('default', { month: 'short' })}
                          </span>
                          <span className="text-sm font-black text-primary leading-none">
                            {new Date(event.date).getDate()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{event.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {event.time} • {event.location}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs mt-2" asChild>
                    <Link href="/events">View All Events <ArrowRight className="ml-2 h-3 w-3" /></Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground space-y-3">
                  <Calendar className="h-12 w-12 mx-auto opacity-20" />
                  <p className="text-sm italic">No upcoming events found.</p>
                  <Button variant="outline" size="sm" className="rounded-full" asChild>
                    <Link href="/events">Browse All</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Listings */}
          <div className="space-y-4">
             <h3 className="font-serif text-xl font-bold flex items-center gap-2 px-1">
                <Heart className="h-5 w-5 text-accent" />
                Featured Alumni
             </h3>
             <UserListings />
          </div>
          
          <Card className="glass bg-accent/5 border-accent/20">
             <CardContent className="p-6 text-center space-y-4">
                <div className="p-3 bg-accent/10 rounded-2xl w-fit mx-auto">
                   <Heart className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-bold">Support Your Alma Mater</h3>
                <p className="text-sm text-muted-foreground">Help shape the future of current students through scholarships.</p>
                <Button variant="secondary" className="w-full rounded-xl" asChild>
                  <Link href="/giving">Donate Now</Link>
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
