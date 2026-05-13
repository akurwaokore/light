"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Infinity,
  Trophy,
  Users,
  Briefcase,
  Heart,
  ShoppingBag,
  Gift,
  Sparkles,
  CreditCard,
  Crown,
  Star,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const subscriptionTiers = [
  {
    id: "annual",
    name: "Annual Membership",
    price: 1000,
    period: "year",
    tagline: "Perfect for active alumni",
    icon: Calendar,
    gradient: "from-blue-500 to-cyan-500",
    features: [
      { icon: CreditCard, text: "Digital membership card with QR code", points: "Instant verification" },
      { icon: Users, text: "Access to all alumni events", points: "Network with peers" },
      { icon: Briefcase, text: "Career hub and job board access", points: "Find opportunities" },
      { icon: Heart, text: "Community feed participation", points: "Stay connected" },
      { icon: ShoppingBag, text: "Marketplace access", points: "Buy & sell services" },
      { icon: Trophy, text: "Earn loyalty points", points: "Redeem at alumni businesses" },
      { icon: Gift, text: "Member perks & discounts", points: "Save on partner services" },
    ],
    benefits: {
      points: "Earn 0.0001 points per KES spent",
      clubs: "Join unlimited clubs (+5 pts each)",
      events: "Attend all year-round events",
      support: "Standard email support",
    },
  },
  {
    id: "lifetime",
    name: "Lifetime Membership",
    price: 10000,
    period: "once",
    tagline: "Invest once, belong forever",
    icon: Infinity,
    gradient: "from-purple-500 to-pink-500",
    popular: true,
    features: [
      { icon: Crown, text: "Everything in Annual, forever", points: "Never expires" },
      { icon: Star, text: "VIP event access", points: "Exclusive experiences" },
      { icon: Sparkles, text: "Priority support", points: "Get help faster" },
      { icon: Trophy, text: "Founding member recognition", points: "Legacy status" },
      { icon: Gift, text: "Exclusive lifetime events", points: "Special gatherings" },
      { icon: CreditCard, text: "Future: Alumni card payments", points: "Use points everywhere" },
    ],
    benefits: {
      points: "Earn 2x points on all activities",
      clubs: "Create clubs (+15 pts at 10 members)",
      events: "VIP access & early registration",
      support: "Priority phone & email support",
    },
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/dashboard")
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const selectedTierData = subscriptionTiers.find((tier) => tier.id === selectedTier)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-xl dark:bg-slate-900/50">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition-opacity">
               <Image src="/logo.png" alt="Light Alumni" width={50} height={50} className="object-contain" />
            </Link>
            <div>
              <h1 className="font-[Belleza] text-xl font-bold">Light Alumni Connect</h1>
              <p className="text-xs text-muted-foreground font-[Alegreya]">Membership Onboarding</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Skip for now
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-white/50 backdrop-blur-xl dark:bg-slate-900/50">
        <div className="container mx-auto p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground font-[Alegreya]">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h2 className="font-[Belleza] text-4xl font-bold">Welcome to Light Alumni Connect!</h2>
                <p className="text-xl text-muted-foreground font-[Alegreya] max-w-2xl mx-auto">
                  Join thousands of alumni staying connected, advancing careers, and building community.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3 mt-12">
                {[
                  { icon: Users, title: "Network & Connect", desc: "Join clubs, attend events, and stay in touch" },
                  { icon: Briefcase, title: "Career Growth", desc: "Access job board and professional opportunities" },
                  { icon: Trophy, title: "Earn Rewards", desc: "Gain loyalty points at alumni-owned businesses" },
                ].map((feature, i) => {
                  const Icon = feature.icon
                  return (
                    <Card key={i} className="glass-card border-white/20">
                      <CardContent className="pt-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-[Belleza] text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground font-[Alegreya]">{feature.desc}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="flex justify-center mt-8">
                <Button size="lg" onClick={handleNext} className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Choose Membership Tier */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4 mb-8">
                <h2 className="font-[Belleza] text-3xl font-bold">Choose Your Membership Tier</h2>
                <p className="text-muted-foreground font-[Alegreya]">
                  Select the plan that works best for you. You can always upgrade later.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {subscriptionTiers.map((tier) => {
                  const Icon = tier.icon
                  const isSelected = selectedTier === tier.id
                  return (
                    <Card
                      key={tier.id}
                      className={`relative cursor-pointer transition-all hover:shadow-xl ${
                        isSelected ? "ring-2 ring-primary shadow-xl scale-[1.02]" : ""
                      } ${tier.popular ? "border-primary" : ""}`}
                      onClick={() => setSelectedTier(tier.id)}
                    >
                      {tier.popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500">
                          Most Popular
                        </Badge>
                      )}
                      <CardHeader>
                        <div
                          className={`inline-flex w-fit items-center justify-center rounded-xl bg-gradient-to-r ${tier.gradient} p-3`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="font-[Belleza] text-2xl">{tier.name}</CardTitle>
                        <CardDescription className="font-[Alegreya]">{tier.tagline}</CardDescription>
                        <div className="mt-4">
                          <span className="font-[Belleza] text-4xl font-bold">KES {tier.price.toLocaleString()}</span>
                          <span className="text-muted-foreground font-[Alegreya]">
                            /{tier.period === "once" ? "one-time" : tier.period}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Separator />
                        <ul className="space-y-3">
                          {tier.features.map((feature, i) => {
                            const FeatureIcon = feature.icon
                            return (
                              <li key={i} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                  <FeatureIcon className="h-3 w-3 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium font-[Alegreya]">{feature.text}</p>
                                  <p className="text-xs text-muted-foreground font-[Alegreya]">{feature.points}</p>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                        {isSelected && (
                          <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                            <Check className="h-4 w-4" />
                            Selected
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleBack} className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!selectedTier} className="gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Benefits Breakdown */}
          {currentStep === 3 && selectedTierData && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4 mb-8">
                <h2 className="font-[Belleza] text-3xl font-bold">Your {selectedTierData.name} Benefits</h2>
                <p className="text-muted-foreground font-[Alegreya]">
                  Here's everything you'll get with your membership
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Loyalty Points Card */}
                <Card className="glass-card">
                  <CardHeader>
                    <div className="inline-flex w-fit items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-3">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="font-[Belleza]">Loyalty Rewards Program</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm font-medium font-[Alegreya]">{selectedTierData.benefits.points}</p>
                    </div>
                    <ul className="space-y-2 text-sm font-[Alegreya]">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Accumulate points for every transaction</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Compete on the leaderboard for prizes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Year-end gift for top points earner</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Coming Soon: Use points at alumni businesses!
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Alumni Card Future Features */}
                <Card className="glass-card border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <div className="inline-flex w-fit items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-3">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="font-[Belleza]">Future: Alumni Card Integration</CardTitle>
                    <Badge variant="secondary" className="w-fit">
                      Coming Soon
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground font-[Alegreya]">
                      We're building the future of alumni engagement!
                    </p>
                    <ul className="space-y-2 text-sm font-[Alegreya]">
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>Embedded loyalty points in your digital card</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>Use points at alumni-owned businesses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>Tap-to-pay at partner locations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>Create a true alumni business ecosystem</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Clubs */}
                <Card className="glass-card">
                  <CardHeader>
                    <div className="inline-flex w-fit items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 p-3">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="font-[Belleza]">Clubs & Community</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium font-[Alegreya]">{selectedTierData.benefits.clubs}</p>
                    </div>
                    <ul className="space-y-2 text-sm font-[Alegreya]">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Join professional and social clubs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Network with like-minded alumni</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Participate in exclusive club events</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Events & Support */}
                <Card className="glass-card">
                  <CardHeader>
                    <div className="inline-flex w-fit items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-3">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="font-[Belleza]">Events & Support</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <p className="text-sm font-medium font-[Alegreya]">{selectedTierData.benefits.events}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <p className="text-sm font-medium font-[Alegreya]">{selectedTierData.benefits.support}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleBack} className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} className="gap-2">
                  Continue to Payment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Payment (Sandbox - Skip Validation) */}
          {currentStep === 4 && selectedTierData && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4 mb-8">
                <h2 className="font-[Belleza] text-3xl font-bold">Complete Your Membership</h2>
                <p className="text-muted-foreground font-[Alegreya]">
                  This is a sandbox environment - no actual payment will be processed
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="font-[Belleza]">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-semibold font-[Belleza]">{selectedTierData.name}</p>
                        <p className="text-sm text-muted-foreground font-[Alegreya]">{selectedTierData.tagline}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-[Belleza] text-2xl">
                          KES {selectedTierData.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground font-[Alegreya]">
                          {selectedTierData.period === "once" ? "one-time" : `per ${selectedTierData.period}`}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">M-Pesa Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0712 345 678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-[Alegreya]">
                        <strong>Sandbox Mode:</strong> This is a demo environment. Click "Complete Membership" to
                        proceed to your dashboard without payment.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handleBack} className="gap-2 bg-transparent">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button size="lg" onClick={handleNext} className="gap-2">
                    <Check className="h-4 w-4" />
                    Complete Membership
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
