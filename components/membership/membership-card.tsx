"use client"

import { useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, CreditCard, Smartphone, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface MembershipCardProps {
  member: {
    id: string
    display_name: string
    email: string
    photo_url?: string
    campus?: string
    graduation_year?: number
    membership_type?: "annual" | "lifetime" | null
    membership_start_date?: string
    membership_expiry?: string
    created_at?: string
  }
  className?: string
  showActions?: boolean
}

export function MembershipCard({ member, className, showActions = true }: MembershipCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Generate Alumni ID from user ID
  const alumniId = `LA-${member.id.substring(0, 8).toUpperCase()}`

  const today = new Date()
  const isLifetime = member.membership_type === "lifetime"
  const expiryDate = member.membership_expiry ? new Date(member.membership_expiry) : null
  const startDate = member.membership_start_date ? new Date(member.membership_start_date) : null

  // Lifetime members are always active, annual members check expiry
  const isActive = isLifetime ? true : expiryDate ? expiryDate >= today : false
  const memberSince = startDate || (member.created_at ? new Date(member.created_at) : new Date())

  // QR Code data - includes membership type and status
  const verificationUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${member.id}`
  const qrData = JSON.stringify({
    name: member.display_name,
    alumniId,
    school: member.campus || "Light Academy",
    membershipType: member.membership_type || "none",
    expiry: isLifetime ? "lifetime" : member.membership_expiry,
    status: isActive ? "active" : "expired",
    verifyUrl: verificationUrl,
  })

  // Format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Download card as PNG
  const downloadAsPNG = async () => {
    if (!cardRef.current) return
    setIsDownloading(true)

    try {
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      })

      const link = document.createElement("a")
      link.download = `light-alumni-card-${alumniId}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Error downloading card:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Download as PDF
  const downloadAsPDF = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch("/api/membership/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const link = document.createElement("a")
        link.download = `light-alumni-card-${alumniId}.pdf`
        link.href = URL.createObjectURL(blob)
        link.click()
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Add to Apple Wallet
  const addToAppleWallet = async () => {
    try {
      const response = await fetch("/api/membership/apple-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const link = document.createElement("a")
        link.download = `light-alumni-${alumniId}.pkpass`
        link.href = URL.createObjectURL(blob)
        link.click()
      }
    } catch (error) {
      console.error("Error creating Apple Wallet pass:", error)
    }
  }

  // Add to Google Wallet
  const addToGoogleWallet = async () => {
    try {
      const response = await fetch("/api/membership/google-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.saveUrl) {
          window.open(data.saveUrl, "_blank")
        }
      }
    } catch (error) {
      console.error("Error creating Google Wallet pass:", error)
    }
  }

  const hasMembership = member.membership_type !== null && member.membership_type !== undefined

  return (
    <div className={cn("space-y-4", className)}>
      {/* Membership Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-md mx-auto overflow-hidden rounded-2xl shadow-2xl"
        style={{ aspectRatio: "1.586/1" }}
      >
        {/* Background gradient - dark blue theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#0f2744] to-[#0a1929]" />

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Card content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image src="/light-alumni-logo.png" alt="Light Alumni" fill className="object-contain" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-wide font-[Belleza]">LIGHT ALUMNI</h3>
                <p className="text-white/60 text-xs font-[Alegreya]">CONNECT</p>
              </div>
            </div>
            <Badge
              className={cn(
                "text-xs font-semibold",
                !hasMembership
                  ? "bg-gray-500/20 text-gray-300 border-gray-500/30"
                  : isActive
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-red-500/20 text-red-300 border-red-500/30",
              )}
            >
              {!hasMembership ? "NO MEMBERSHIP" : isActive ? "ACTIVE" : "EXPIRED"}
            </Badge>
          </div>

          {/* Member Info */}
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-white/20">
                <AvatarImage src={member.photo_url || undefined} />
                <AvatarFallback className="bg-white/10 text-white text-lg">
                  {member.display_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-white font-bold text-lg leading-tight font-[Belleza]">{member.display_name}</h4>
                <p className="text-white/70 text-sm font-[Alegreya]">{member.campus || "Light Academy"}</p>
                <p className="text-white/50 text-xs font-[Alegreya]">Class of {member.graduation_year || "N/A"}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-2 rounded-lg">
              <QRCodeSVG value={qrData} size={70} level="M" includeMargin={false} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between pt-2 border-t border-white/10">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-white/50 uppercase tracking-wider">Alumni ID</p>
                <p className="text-white font-mono font-semibold">{alumniId}</p>
              </div>
              <div>
                <p className="text-white/50 uppercase tracking-wider">Start Date</p>
                <p className="text-white font-semibold font-[Alegreya]">{formatDate(memberSince)}</p>
              </div>
              <div>
                <p className="text-white/50 uppercase tracking-wider">Valid Until</p>
                <p className={cn("font-semibold font-[Alegreya]", isActive ? "text-emerald-300" : "text-red-300")}>
                  {isLifetime ? "Lifetime" : formatDate(expiryDate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-[Alegreya]">
                {isLifetime ? "Lifetime" : member.membership_type === "annual" ? "Annual" : "No"} Member
              </p>
            </div>
          </div>

          {/* Motto */}
          <p className="text-center text-white/40 text-[10px] italic mt-2 font-[Belleza]">
            &quot;Once Students, Always Family&quot;
          </p>
        </div>

        {/* Expired overlay - only for annual members */}
        {!isActive && hasMembership && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="bg-red-600/90 px-6 py-2 -rotate-12 shadow-lg">
              <p className="text-white font-bold text-lg tracking-wider font-[Belleza]">MEMBERSHIP EXPIRED</p>
            </div>
          </div>
        )}

        {/* No membership overlay */}
        {!hasMembership && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="bg-gray-700/90 px-6 py-3 rounded-lg shadow-lg text-center">
              <p className="text-white font-bold text-lg tracking-wider font-[Belleza]">NO ACTIVE MEMBERSHIP</p>
              <p className="text-white/70 text-sm mt-1 font-[Alegreya]">Purchase a membership to activate your card</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - only show if membership is active */}
      {showActions && hasMembership && isActive && (
        <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAsPNG}
            disabled={isDownloading}
            className="flex-1 min-w-[140px] bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAsPDF}
            disabled={isDownloading}
            className="flex-1 min-w-[140px] bg-transparent"
          >
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addToAppleWallet}
            className="flex-1 min-w-[140px] bg-transparent"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Apple Wallet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addToGoogleWallet}
            className="flex-1 min-w-[140px] bg-transparent"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Google Wallet
          </Button>
        </div>
      )}
    </div>
  )
}
