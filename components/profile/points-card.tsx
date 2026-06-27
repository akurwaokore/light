"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Award, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface PointsTransaction {
  id: string
  points: number
  type: string
  reason: string
  created_at: string
  metadata: any
}

interface PointsCardProps {
  userId: string
  initialPoints?: number
}

export function PointsCard({ userId, initialPoints = 0 }: PointsCardProps) {
  const [points, setPoints] = useState(initialPoints)
  const [rank, setRank] = useState<number | null>(null)
  const [history, setHistory] = useState<PointsTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPointsData()
  }, [userId])

  const fetchPointsData = async () => {
    try {
      // Fetch leaderboard to get user's rank
      const leaderboardRes = await fetch("/api/points/leaderboard")
      const leaderboardData = await leaderboardRes.json()
      const userEntry = leaderboardData.leaderboard?.find((entry: any) => entry.id === userId)
      if (userEntry) {
        setPoints(userEntry.points)
        setRank(userEntry.rank)
      }

      // Fetch points history
      const historyRes = await fetch(`/api/points/history?userId=${userId}`)
      const historyData = await historyRes.json()
      setHistory(historyData.transactions || [])
    } catch (error) {
      console.error("[akurwas] Error fetching points data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = () => {
    if (!rank) return null
    if (rank === 1) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Champion</Badge>
    if (rank <= 3) return <Badge className="bg-blue-500 hover:bg-blue-600">Top 3</Badge>
    if (rank <= 10) return <Badge variant="secondary">Top 10</Badge>
    return <Badge variant="outline">#{rank}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card className="glass-card border-white/20 rounded-3xl animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-12 w-24 bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-white/20 rounded-3xl hover-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Points & Ranking
        </CardTitle>
        {getRankBadge()}
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-4">
          <div className="text-4xl font-bold">{points}</div>
          <div className="text-muted-foreground pb-1">points</div>
        </div>

        {rank && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <TrendingUp className="h-4 w-4" />
            <span>Ranked #{rank} on leaderboard</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1 bg-transparent">
            <Link href="/leaderboard">
              <Award className="mr-2 h-4 w-4" />
              View Leaderboard
            </Link>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <History className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Points History</DialogTitle>
                <DialogDescription>Your points transaction history</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No points transactions yet</p>
                    <p className="text-sm">Start buying or selling to earn points!</p>
                  </div>
                ) : (
                  history.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{transaction.reason}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</p>
                      </div>
                      <div
                        className={`text-lg font-bold ${transaction.points > 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {transaction.points > 0 ? "+" : ""}
                        {transaction.points}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-muted-foreground">Earn 50 points per sale • 10 points per purchase</p>
        </div>
      </CardContent>
    </Card>
  )
}
