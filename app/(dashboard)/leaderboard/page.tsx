"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Medal, Award, TrendingUp, Calendar } from "lucide-react"

interface LeaderboardEntry {
  id: string
  display_name: string
  photo_url?: string
  campus: string
  graduation_year: number
  points: number
  rank: number
  total_transactions: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [campus, setCampus] = useState("all")

  useEffect(() => {
    fetchLeaderboard()
  }, [campus])

  const fetchLeaderboard = async () => {
    try {
      const params = new URLSearchParams({ campus, limit: "50" })
      const response = await fetch(`/api/points/leaderboard?${params}`)
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
    } catch (error) {
      console.error("[akurwas] Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />
      default:
        return <Award className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Champion</Badge>
    if (rank <= 3) return <Badge className="bg-blue-500 hover:bg-blue-600">Top 3</Badge>
    if (rank <= 10) return <Badge variant="secondary">Top 10</Badge>
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="glass-card rounded-3xl p-6 animate-pulse sm:p-8">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Points Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Top alumni members ranked by marketplace activity points. The highest scorer wins the End Year Alumni
              Party Gift!
            </p>
          </div>
          <Select value={campus} onValueChange={setCampus}>
            <SelectTrigger className="w-full sm:w-[200px] glass-card border-white/20">
              <SelectValue placeholder="Select campus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campuses</SelectItem>
              <SelectItem value="Light Academy Nairobi">Light Academy Nairobi</SelectItem>
              <SelectItem value="Light Academy Mombasa">Light Academy Mombasa</SelectItem>
              <SelectItem value="Light Academy Kisumu">Light Academy Kisumu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* 2nd Place */}
          <Card className="glass-card border-white/20 rounded-3xl hover-card mt-8">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                <Medal className="h-12 w-12 text-gray-400" />
              </div>
              <Badge className="mx-auto mb-2 bg-gray-400">2nd Place</Badge>
              <Avatar className="h-20 w-20 mx-auto mb-2 ring-4 ring-gray-400/30">
                <AvatarImage src={leaderboard[1].photo_url || "/placeholder.svg"} />
                <AvatarFallback>{leaderboard[1].display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-lg">{leaderboard[1].display_name}</CardTitle>
              <CardDescription>{leaderboard[1].campus}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-gray-400">{leaderboard[1].points}</div>
              <div className="text-sm text-muted-foreground">points</div>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="glass-card border-white/20 rounded-3xl hover-card relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-lg px-4 py-2">Champion</Badge>
            </div>
            <CardHeader className="text-center pb-3 pt-8">
              <div className="flex justify-center mb-2">
                <Trophy className="h-16 w-16 text-yellow-500" />
              </div>
              <Avatar className="h-24 w-24 mx-auto mb-2 ring-4 ring-yellow-500/50">
                <AvatarImage src={leaderboard[0].photo_url || "/placeholder.svg"} />
                <AvatarFallback>{leaderboard[0].display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{leaderboard[0].display_name}</CardTitle>
              <CardDescription>{leaderboard[0].campus}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-yellow-500">{leaderboard[0].points}</div>
              <div className="text-sm text-muted-foreground">points</div>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="glass-card border-white/20 rounded-3xl hover-card mt-8">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                <Medal className="h-12 w-12 text-orange-600" />
              </div>
              <Badge className="mx-auto mb-2 bg-orange-600">3rd Place</Badge>
              <Avatar className="h-20 w-20 mx-auto mb-2 ring-4 ring-orange-600/30">
                <AvatarImage src={leaderboard[2].photo_url || "/placeholder.svg"} />
                <AvatarFallback>{leaderboard[2].display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-lg">{leaderboard[2].display_name}</CardTitle>
              <CardDescription>{leaderboard[2].campus}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-orange-600">{leaderboard[2].points}</div>
              <div className="text-sm text-muted-foreground">points</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card className="glass-card border-white/20 rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Full Rankings
          </CardTitle>
          <CardDescription>All alumni members ranked by total points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all sm:gap-4 sm:p-4 ${
                  entry.rank <= 3
                    ? "glass-card border-white/20 hover:scale-[1.02]"
                    : "hover:bg-accent/50 border border-transparent hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-center w-8 shrink-0 sm:w-12">
                  {entry.rank <= 3 ? (
                    getRankIcon(entry.rank)
                  ) : (
                    <span className="text-lg font-semibold">#{entry.rank}</span>
                  )}
                </div>

                <Avatar className="h-10 w-10 shrink-0 sm:h-12 sm:w-12">
                  <AvatarImage src={entry.photo_url || "/placeholder.svg"} />
                  <AvatarFallback>{entry.display_name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{entry.display_name || "Anonymous"}</h3>
                    {getRankBadge(entry.rank)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="truncate">{entry.campus}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Class of {entry.graduation_year}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{entry.total_transactions} transactions</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-bold sm:text-2xl">{entry.points}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Points Info */}
      <Card className="glass-card border-white/20 rounded-3xl">
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <h3 className="font-semibold text-green-600 mb-2">Selling Products or Services</h3>
              <p className="text-sm text-muted-foreground">Earn 50 points for each completed sale in the marketplace</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <h3 className="font-semibold text-blue-600 mb-2">Purchasing Items</h3>
              <p className="text-sm text-muted-foreground">Earn 10 points for each purchase you make</p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
            <h3 className="font-semibold text-yellow-600 mb-2">
              <Trophy className="inline h-5 w-5 mr-2" />
              End Year Prize
            </h3>
            <p className="text-sm text-muted-foreground">
              The alumni member with the highest points at the end of the year wins an exclusive gift at the Annual
              Alumni Party!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
