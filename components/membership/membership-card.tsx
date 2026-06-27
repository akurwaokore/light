"use client"

import { useMemo, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, CreditCard, Smartphone, FileText, CalendarDays, GraduationCap, School, CircleCheckBig, CircleDashed } from "lucide-react"
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
  const hasMembership = member.membership_type !== null && member.membership_type !== undefined

  // Lifetime members are always active, annual members check expiry
  const isActive = isLifetime ? true : expiryDate ? expiryDate >= today : false
  const memberSince = startDate || (member.created_at ? new Date(member.created_at) : new Date())

  // QR code should open a verification page, not raw JSON.
  const verificationUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/verify/${member.id}`
  }, [member.id])

  const schoolName = member.campus || "Light Academy"
  const graduationYear = member.graduation_year || "N/A"
  const paymentStatus = hasMembership && isActive ? "Paid" : hasMembership ? "Expired" : "Unpaid"
  const membershipLabel = isLifetime ? "Lifetime" : member.membership_type === "annual" ? "Annual" : "No Membership"

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

  const detailItems = [
    { label: "Status", value: paymentStatus, icon: hasMembership && isActive ? CircleCheckBig : CircleDashed, accent: hasMembership && isActive ? "text-emerald-300" : hasMembership ? "text-amber-300" : "text-slate-300" },
    { label: "Valid Till", value: isLifetime ? "Lifetime" : formatDate(expiryDate), icon: CalendarDays, accent: isActive ? "text-emerald-300" : "text-red-300" },
    { label: "School", value: schoolName, icon: School, accent: "text-sky-200" },
    { label: "Graduate Year", value: String(graduationYear), icon: GraduationCap, accent: "text-violet-200" },
  ]

  return (
    <div className={cn("space-y-4", className)}>
      {/* Membership Card */}
      <div
        ref={cardRef}
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] shadow-2xl"
        style={{ aspectRatio: "1.586/1" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.28),_transparent_28%),linear-gradient(145deg,#07111f_0%,#0c1f35_45%,#102f54_100%)]" />

        <div className="absolute inset-x-6 top-5 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute -right-10 top-10 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -left-10 bottom-8 h-28 w-28 rounded-full bg-sky-300/10 blur-2xl" />

        <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-white/8 p-2 ring-1 ring-white/10">
                <Image src="/light-alumni-logo.png" alt="Light Alumni" fill className="object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-[Belleza] text-sm font-bold tracking-[0.2em] text-white">LIGHT ALUMNI</h3>
                <p className="font-[Alegreya] text-xs text-white/60">Digital Membership</p>
              </div>
            </div>
            <Badge
              className={cn(
                "shrink-0 border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
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

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/6 px-3 py-3 backdrop-blur-sm">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-14 w-14 shrink-0 border-2 border-white/20">
                <AvatarImage src={member.photo_url || undefined} />
                <AvatarFallback className="bg-white/10 text-lg text-white">
                  {member.display_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "?"}
                </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h4 className="truncate font-[Belleza] text-lg font-bold leading-tight text-white">{member.display_name}</h4>
                  <p className="truncate font-[Alegreya] text-sm text-white/70">{schoolName}</p>
                  <p className="font-[Alegreya] text-xs text-white/50">Class of {graduationYear}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-[Alegreya] text-[10px] uppercase tracking-[0.18em] text-white/45">Member Type</p>
                <p className="font-[Belleza] text-sm text-white">{membershipLabel}</p>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-3">
              <div className="grid grid-cols-2 gap-2">
                {detailItems.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
                    <div className="mb-1 flex items-center gap-1.5">
                      <item.icon className={cn("h-3.5 w-3.5", item.accent)} />
                      <p className="truncate text-[10px] uppercase tracking-[0.16em] text-white/45">{item.label}</p>
                    </div>
                    <p className={cn("truncate font-[Alegreya] text-sm font-semibold", item.accent === "text-red-300" ? "text-red-300" : "text-white")}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-between rounded-[24px] border border-white/10 bg-white px-2 py-2 shadow-lg">
                <QRCodeSVG value={verificationUrl || member.id} size={74} level="M" includeMargin={false} />
                <p className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Scan to verify
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-t border-white/10 pt-3 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            <div className="text-left sm:text-right">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-[Alegreya]">
                QR opens live verification status
              </p>
            </div>
          </div>

          <p className="mt-1 text-center font-[Belleza] text-[10px] italic text-white/40">
            &quot;Once Students, Always Family&quot;
          </p>
        </div>

        {!isActive && hasMembership && (
          <div className="pointer-events-none absolute inset-x-4 bottom-12 z-20 rounded-2xl border border-amber-300/30 bg-black/55 px-4 py-3 backdrop-blur-sm">
            <div className="text-center">
              <p className="font-[Belleza] text-sm font-bold tracking-[0.18em] text-amber-200">MEMBERSHIP EXPIRED</p>
              <p className="mt-1 font-[Alegreya] text-xs text-white/75">Scan the QR code to view the latest status.</p>
            </div>
          </div>
        )}

        {!hasMembership && (
          <div className="pointer-events-none absolute inset-x-4 bottom-12 z-20 rounded-2xl border border-slate-200/20 bg-black/55 px-4 py-3 backdrop-blur-sm">
            <div className="text-center">
              <p className="font-[Belleza] text-sm font-bold tracking-[0.18em] text-white">NO ACTIVE MEMBERSHIP</p>
              <p className="mt-1 font-[Alegreya] text-xs text-white/75">QR verification will show unpaid status until membership is activated.</p>
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
