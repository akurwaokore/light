"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Heart, Target, TrendingUp, Loader2 } from "lucide-react"

interface Campaign {
  id: string
  title: string
  description: string
  goal: number
  raised: number
  imageURL: string | null
}

export default function GivingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [donationAmount, setDonationAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")

  const presetAmounts = ["500", "1000", "2500", "5000", "10000"]

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch("/api/donations")
        if (res.ok) {
          const data = await res.json()
          setCampaigns(data || [])
        }
      } catch {
        // Surface nothing destructive; empty state handles failures.
      } finally {
        setIsLoading(false)
      }
    }
    fetchCampaigns()
  }, [])

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`
  }

  const calculateProgress = (raised: number, goal: number) => {
    if (!goal) return 0
    return Math.min((raised / goal) * 100, 100)
  }

  const totalRaised = campaigns.reduce((sum, c) => sum + (c.raised || 0), 0)
  const totalGoal = campaigns.reduce((sum, c) => sum + (c.goal || 0), 0)
  const overallProgress = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Give Back</h1>
        <p className="mt-1 text-muted-foreground">Support school initiatives and help shape the future</p>
      </div>

      {/* Impact Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold">{formatCurrency(totalRaised)}</p>
              <p className="text-sm text-muted-foreground">Total Raised</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-3">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{campaigns.length}</p>
              <p className="text-sm text-muted-foreground">Active Campaigns</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{overallProgress}%</p>
              <p className="text-sm text-muted-foreground">Overall Funded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Heart className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No active campaigns</h3>
            <p className="max-w-xs text-muted-foreground">
              There are no fundraising campaigns running right now. Check back soon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const progress = calculateProgress(campaign.raised, campaign.goal)

            return (
              <Card key={campaign.id} className="overflow-hidden">
                {campaign.imageURL && (
                  <div className="aspect-video bg-muted">
                    <img
                      src={campaign.imageURL || "/placeholder.svg"}
                      alt={campaign.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-serif">{campaign.title}</CardTitle>
                  <CardDescription>{campaign.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{formatCurrency(campaign.raised)} raised</span>
                      <span className="text-right text-muted-foreground">of {formatCurrency(campaign.goal)}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{Math.round(progress)}% funded</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => setSelectedCampaign(campaign.id)}>
                    Donate Now
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Donation Form */}
      {selectedCampaign && (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="font-serif">Make a Donation</CardTitle>
            <CardDescription>{campaigns.find((c) => c.id === selectedCampaign)?.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Select Amount</Label>
              <RadioGroup
                value={donationAmount}
                onValueChange={(value) => {
                  setDonationAmount(value)
                  setCustomAmount("")
                }}
                className="grid grid-cols-3 gap-3"
              >
                {presetAmounts.map((amount) => (
                  <Label
                    key={amount}
                    htmlFor={`amount-${amount}`}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 transition-colors ${
                      donationAmount === amount
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={amount} id={`amount-${amount}`} className="sr-only" />
                    <span className="font-medium">KES {Number.parseInt(amount).toLocaleString()}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom">Or enter custom amount</Label>
              <Input
                id="custom"
                type="number"
                placeholder="Enter amount in KES"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value)
                  setDonationAmount("")
                }}
              />
            </div>

            <Button className="w-full" disabled={!donationAmount && !customAmount}>
              <Heart className="mr-2 h-4 w-4" />
              Donate KES{" "}
              {(donationAmount || customAmount ? Number.parseInt(donationAmount || customAmount) : 0).toLocaleString()}
            </Button>

            <p className="text-center text-sm text-muted-foreground">Payments are processed securely via M-Pesa</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
