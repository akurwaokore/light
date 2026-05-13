"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Trophy,
  TrendingUp,
  Users,
  Award,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

export default function AdminPointsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/points/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("[akurwas] Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const milestoneData = [
    { name: "25% (250pts)", value: stats?.milestones?.["25%"] || 0, color: COLORS[0] },
    { name: "50% (500pts)", value: stats?.milestones?.["50%"] || 0, color: COLORS[1] },
    { name: "75% (750pts)", value: stats?.milestones?.["75%"] || 0, color: COLORS[2] },
    { name: "100% (1000pts)", value: stats?.milestones?.["100%"] || 0, color: COLORS[3] },
  ]

  const statCards = [
    {
      title: "Total Participants",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "Active in points system",
      color: "text-blue-500",
    },
    {
      title: "Total Points Awarded",
      value: stats?.totalPoints?.toLocaleString() || "0",
      icon: Trophy,
      description: "All-time points",
      color: "text-yellow-500",
    },
    {
      title: "Average Points",
      value: stats?.averagePoints?.toFixed(2) || "0",
      icon: Target,
      description: "Per active user",
      color: "text-green-500",
    },
    {
      title: "Growth Rate",
      value: `${stats?.growthRate > 0 ? "+" : ""}${stats?.growthRate?.toFixed(1) || 0}%`,
      icon: stats?.growthRate >= 0 ? TrendingUp : ArrowDownRight,
      description: "vs previous week",
      color: stats?.growthRate >= 0 ? "text-green-500" : "text-red-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Points Management Dashboard</h1>
          <p className="text-muted-foreground">Monitor user engagement and milestone progress</p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass-card border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Milestone Distribution */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle>Milestone Distribution</CardTitle>
            <CardDescription>Users at each milestone level (out of 1000 points)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={milestoneData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {milestoneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {milestoneData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Users with highest points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topUsers?.slice(0, 8).map((user: any, index: number) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`/.jpg?height=36&width=36&query=${user.display_name}`} />
                    <AvatarFallback>
                      {user.display_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.display_name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">Rank #{user.points_rank}</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    {Number.parseFloat(user.points).toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest points transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentActivity?.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === "earn"
                        ? "bg-green-500/10 text-green-500"
                        : activity.type === "redeem"
                          ? "bg-orange-500/10 text-orange-500"
                          : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {activity.type === "earn" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{activity.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={activity.type === "earn" ? "default" : "secondary"}
                  className={activity.type === "earn" ? "bg-green-500" : ""}
                >
                  {activity.type === "earn" ? "+" : "-"}
                  {Number.parseFloat(activity.points).toFixed(4)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-0 border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              Points Formula
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Each transaction value: <strong>Amount × 0.0001</strong>
            </p>
            <p className="mt-2">Example: KES 10,000 sale = 1.0 points</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Milestone Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>25%, 50%, 75%, 100% of 1000 points</p>
            <p className="mt-2">Automatic notifications sent</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              End Year Prize
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Top scorer wins exclusive gift</p>
            <p className="mt-2">Awarded at Alumni Party event</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
