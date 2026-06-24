"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  MessageSquare,
  Heart,
  Trophy,
  Target,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function AdminDashboard() {
  const [liveStats, setLiveStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats")
        if (res.ok) {
          const data = await res.json()
          setLiveStats(data)
        }
      } catch (err) {
        console.error("Failed to fetch stats", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const stats = [
    {
      title: "Total Members",
      value: liveStats?.totalMembers?.toLocaleString() || "0",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      description: "vs last month",
    },
    {
      title: "Active Events",
      value: liveStats?.activeEvents?.toLocaleString() || "0",
      change: "+8.2%",
      trend: "up",
      icon: Calendar,
      description: "vs last month",
    },
    {
      title: "Total Donations",
      value: `KES ${(liveStats?.totalDonations || 0).toLocaleString()}`,
      change: "",
      trend: "up",
      icon: DollarSign,
      description: "all-time raised",
    },
    {
      title: "Loyalty Points Awarded",
      value: (liveStats?.totalPoints || 0).toLocaleString(),
      change: "",
      trend: "up",
      icon: Trophy,
      description: `${liveStats?.participants || 0} earning members`,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your alumni community.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {stat.change ? (
                  <>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>{stat.change}</span>
                  </>
                ) : null}
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Points System Monitoring Card */}
      <Card className="glass-card border-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Points System Overview
            </CardTitle>
            <CardDescription>Active user engagement and milestone tracking</CardDescription>
          </div>
          <Link href="/admin/points">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              View Details
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Participants
              </div>
              <div className="text-2xl font-bold">{liveStats?.totalMembers || 0}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4" />
                Total Points
              </div>
              <div className="text-2xl font-bold">{(liveStats?.totalPoints || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All-time awarded</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Average Points
              </div>
              <div className="text-2xl font-bold">{(liveStats?.avgPoints || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per active user</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Growth Rate
              </div>
              <div className="text-2xl font-bold flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                0%
              </div>
              <p className="text-xs text-muted-foreground">vs previous week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
            <CardDescription>Total registered members over the past year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveStats?.memberGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="members"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Engagement</CardTitle>
            <CardDescription>Activity levels (Posts, Events)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">Detailed activity logs coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Member Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Member Distribution</CardTitle>
            <CardDescription>By graduation year range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={liveStats?.memberDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}`}
                    labelLine={false}
                  >
                    {liveStats?.memberDistribution?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {liveStats?.memberDistribution?.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value} members</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Members</CardTitle>
              <CardDescription>Newly registered alumni</CardDescription>
            </div>
            <Link href="/admin/members">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveStats?.recentMembers?.map((member: any) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{member.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.display_name}</p>
                    <p className="text-xs text-muted-foreground">Class of {member.graduation_year || "N/A"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(member.created_at).toLocaleDateString()}
                  </span>
                </div>
              )) || <p className="text-sm text-muted-foreground text-center py-4">No recent members</p>}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items requiring review</CardDescription>
            </div>
            <Badge variant="secondary">{liveStats?.pendingApprovals || 0}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveStats?.pendingList?.map((item: any) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    {item.type === "Job Posting" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : item.type === "Event" ? (
                      <Calendar className="h-4 w-4" />
                    ) : (
                      <Target className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type} by {item.by}
                    </p>
                  </div>
                  <Link href={item.link || "/admin/moderation"}>
                    <Button variant="ghost" size="sm">
                      Review
                    </Button>
                  </Link>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">No items pending approval</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent">
              <UserPlus className="h-5 w-5" />
              <span>Add Member</span>
            </Button>
            <Link href="/admin/events" className="w-full">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent w-full">
                <Calendar className="h-5 w-5" />
                <span>Create Event</span>
              </Button>
            </Link>
            <Link href="/admin/newsletter" className="w-full">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent w-full">
                <MessageSquare className="h-5 w-5" />
                <span>Send Newsletter</span>
              </Button>
            </Link>
            <Link href="/admin/donations" className="w-full">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent w-full">
                <Heart className="h-5 w-5" />
                <span>New Campaign</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
