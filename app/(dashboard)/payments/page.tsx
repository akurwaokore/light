"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  CreditCard,
  Check,
  Smartphone,
  Crown,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Infinity,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

const membershipTiers = [
  {
    id: "annual",
    name: "Annual Membership",
    price: 1000,
    period: "year",
    description: "Full access for one year",
    features: [
      "Digital membership card with QR code",
      "Access to all alumni events",
      "Career hub and job board access",
      "Community feed participation",
      "Marketplace access",
      "Club memberships",
      "Member perks & discounts",
    ],
    icon: Calendar,
    popular: true,
  },
  {
    id: "lifetime",
    name: "Lifetime Membership",
    price: 10000,
    period: "once",
    description: "Never expires - one-time payment",
    features: [
      "Everything in Annual, forever",
      "Lifetime membership card",
      "VIP event access",
      "Priority support",
      "Founding member recognition",
      "Exclusive lifetime member events",
      "Legacy benefits",
    ],
    icon: Infinity,
    popular: false,
  },
]

export default function PaymentsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchProfile()
    
    // Check for payment status from URL callback
    const status = searchParams.get("status")
    const msg = searchParams.get("message")
    
    if (status === "completed") {
      setPaymentStatus("completed")
      toast.success("Payment completed successfully!")
      // In a real app, the backend handles the update, 
      // but we might need to refresh profile to see changes
      setTimeout(fetchProfile, 2000)
    } else if (status === "failed") {
      setError("Payment was unsuccessful. Please try again.")
    } else if (status === "error") {
      setError(msg || "An error occurred during payment.")
    }
  }, [searchParams])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (err) {
      console.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handlePesapalPayment = async (tier: any) => {
    setProcessing(true)
    setError(null)

    try {
      const callbackUrl = `${window.location.origin}/api/payments/pesapal/callback`
      
      const response = await fetch("/api/payments/pesapal/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: tier.price,
          description: `Light Alumni ${tier.name}`,
          callback_url: callbackUrl,
          cancellation_url: window.location.href,
          billing_address: {
            email_address: profile?.email || "",
            phone_number: profile?.phone || "",
            first_name: profile?.full_name?.split(" ")[0] || "Alumni",
            last_name: profile?.full_name?.split(" ")[1] || "Member",
          }
        }),
      })

      const data = await response.json()

      if (data.redirect_url) {
        // Redirect to Pesapal payment page
        window.location.href = data.redirect_url
      } else {
        throw new Error(data.error || "Failed to initiate payment")
      }
    } catch (err: any) {
      console.error("Payment initiation error:", err)
      setError(err.message || "Failed to start payment process.")
      setProcessing(false)
    }
  }

  const handleMpesaSubscribe = async (tier: any) => {
    const phone = (mpesaPhone || "").trim()
    if (!/^2547\d{8}$/.test(phone)) {
      setError("Enter your M-Pesa number as 2547XXXXXXXX")
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const response = await fetch("/api/payments/mpesa/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId: tier.id, phone }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to start M-Pesa payment")
      toast.success(data.message || "Check your phone to authorize the payment.")
      setPaymentStatus("processing")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const getCurrentMembershipStatus = () => {
    if (!profile?.membership_tier || profile.membership_tier === "free") return null

    const isLifetime = profile.membership_tier === "platinum" // mapping lifetime to platinum for now
    const expiryDate = profile.membership_expiry ? new Date(profile.membership_expiry) : null
    const isActive = isLifetime ? true : expiryDate ? expiryDate >= new Date() : false

    return {
      tier: profile.membership_tier,
      isLifetime,
      isActive,
      expiryDate,
    }
  }

  const membershipStatus = getCurrentMembershipStatus()

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="font-[Belleza] text-3xl font-bold">Membership & Payments</h1>
        <p className="mt-1 text-muted-foreground font-[Alegreya]">Choose your membership plan</p>
      </div>

      {paymentStatus === "completed" && (
        <Alert className="border-emerald-500 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800">Payment Successful!</AlertTitle>
          <AlertDescription className="text-emerald-700">
            Your membership is being processed. It will be active shortly.
          </AlertDescription>
        </Alert>
      )}

      {membershipStatus && (
        <Card className={membershipStatus.isActive ? "border-emerald-500/30 bg-emerald-50/50" : "border-red-500/30 bg-red-50/50"}>
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${membershipStatus.isActive ? "bg-emerald-100" : "bg-red-100"}`}>
                {membershipStatus.isLifetime ? (
                  <Infinity className={`h-6 w-6 ${membershipStatus.isActive ? "text-emerald-600" : "text-red-600"}`} />
                ) : (
                  <Calendar className={`h-6 w-6 ${membershipStatus.isActive ? "text-emerald-600" : "text-red-600"}`} />
                )}
              </div>
              <div>
                <p className="font-semibold font-[Belleza]">
                  Current Status: <span className="capitalize">{membershipStatus.tier}</span> Membership
                </p>
                <p className="text-sm text-muted-foreground font-[Alegreya]">
                  {membershipStatus.isLifetime
                    ? "Never expires"
                    : membershipStatus.isActive
                      ? `Valid until ${membershipStatus.expiryDate?.toLocaleDateString()}`
                      : `Expired on ${membershipStatus.expiryDate?.toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <Badge className={membershipStatus.isActive ? "bg-emerald-500" : "bg-red-500"}>
              {membershipStatus.isActive ? "Active" : "Expired"}
            </Badge>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {membershipTiers.map((tier) => {
          const Icon = tier.icon
          const isCurrentTier = (tier.id === "annual" && profile?.membership_tier === "silver") || 
                               (tier.id === "lifetime" && profile?.membership_tier === "platinum")

          return (
            <Card key={tier.id} className={`relative transition-all ${tier.popular ? "border-primary shadow-lg" : ""}`}>
              {tier.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}
              <CardHeader>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="mt-4 font-[Belleza] text-xl">{tier.name}</CardTitle>
                <CardDescription className="font-[Alegreya]">{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="font-[Belleza] text-4xl font-bold">KES {tier.price.toLocaleString()}</span>
                  <span className="text-muted-foreground font-[Alegreya]">
                    /{tier.period === "once" ? "one-time" : tier.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-[Alegreya]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full mt-6"
                  variant={tier.popular ? "default" : "outline"}
                  disabled={processing || (isCurrentTier && membershipStatus?.isActive)}
                  onClick={() => handlePesapalPayment(tier)}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isCurrentTier && membershipStatus?.isActive
                    ? "Current Plan"
                    : tier.id === "lifetime" ? "Get Lifetime Access (PesaPal)" : "Subscribe via PesaPal"}
                </Button>

                {!(isCurrentTier && membershipStatus?.isActive) && (
                  <div className="mt-3 space-y-2 rounded-lg border border-green-600/20 bg-green-50/40 p-3">
                    <p className="text-xs font-medium text-green-700">Or pay with M-Pesa</p>
                    <Input
                      placeholder="2547XXXXXXXX"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      inputMode="numeric"
                      className="h-9"
                    />
                    <Button
                      variant="outline"
                      className="w-full border-green-600/40"
                      disabled={processing}
                      onClick={() => handleMpesaSubscribe(tier)}
                    >
                      {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Pay KES {tier.price.toLocaleString()} with M-Pesa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="font-[Belleza]">Payment Methods</CardTitle>
          <CardDescription className="font-[Alegreya]">Secure payments via PesaPal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
             <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Smartphone className="h-6 w-6 text-green-600" />
                <span className="font-medium">M-Pesa</span>
             </div>
             <div className="flex items-center gap-3 p-4 border rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Visa / Mastercard</span>
             </div>
             <div className="flex items-center gap-3 p-4 border rounded-lg opacity-60">
                <Smartphone className="h-6 w-6 text-red-600" />
                <span className="font-medium">Airtel Money</span>
             </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="font-semibold font-[Belleza] mb-2">Secure Checkout</h4>
            <p className="text-sm text-muted-foreground font-[Alegreya]">
              You will be redirected to PesaPal's secure payment page to complete your transaction. 
              We support M-Pesa, Card payments, and other mobile money options.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
