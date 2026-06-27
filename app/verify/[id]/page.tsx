import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, XCircle, Calendar, GraduationCap, Building2, Award as IdCard, Infinity, CircleDollarSign, ShieldCheck } from "lucide-react"
import Image from "next/image"

interface VerifyPageProps {
  params: Promise<{ id: string }>
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  // Fetch member profile
  const { data: member, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle()

  if (error || !member) {
    notFound()
  }

  const today = new Date()
  const isLifetime = member.membership_type === "lifetime"
  const expiryDate = member.membership_expiry ? new Date(member.membership_expiry) : null
  const hasMembership = member.membership_type !== null && member.membership_type !== undefined

  // Lifetime members are always active, annual members check expiry
  const isActive = hasMembership ? (isLifetime ? true : expiryDate ? expiryDate >= today : false) : false

  const alumniId = `LA-${member.id.substring(0, 8).toUpperCase()}`
  const schoolName = member.campus || "Light Academy"
  const graduationYear = member.graduation_year || "N/A"
  const paymentStatus = hasMembership && isActive ? "Paid" : hasMembership ? "Expired" : "Unpaid"
  const statusTone = isActive ? "emerald" : hasMembership ? "amber" : "red"

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,#020817_0%,#0f172a_100%)] p-4">
      <Card className="w-full max-w-2xl overflow-hidden border-white/10 bg-white shadow-2xl">
        <CardHeader className={`text-center text-white ${isActive ? "bg-emerald-600" : hasMembership ? "bg-amber-600" : "bg-red-600"}`}>
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 bg-white rounded-full p-2">
              <Image src="/light-alumni-logo.png" alt="Light Alumni" fill className="object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-[Belleza] flex items-center justify-center gap-2">
            {isActive ? (
              <>
                <CheckCircle2 className="h-8 w-8" />
                Verified Member
              </>
            ) : (
              <>
                <XCircle className="h-8 w-8" />
                {hasMembership ? "Expired Membership" : "No Membership"}
              </>
            )}
          </CardTitle>
          <p className="mt-1 text-sm text-white/80 font-[Alegreya]">Live membership status from Light Alumni Connect</p>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className={`rounded-2xl border p-4 text-center ${
            isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : hasMembership
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-red-200 bg-red-50 text-red-800"
          }`}>
            <p className="font-[Belleza] text-lg font-bold">
              {isActive
                ? "Membership is verified and currently paid."
                : hasMembership
                  ? "Membership record found, but it is no longer active."
                  : "No paid membership is attached to this alumni profile."}
            </p>
            <p className="mt-1 text-sm font-[Alegreya]">
              This page reflects the card holder&apos;s current status in real time.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
              <AvatarImage src={member.photo_url || undefined} />
              <AvatarFallback className="bg-slate-200 text-slate-600 text-2xl">
                {member.display_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-[Belleza] text-2xl font-bold text-slate-900">{member.display_name}</h2>
              <p className="truncate font-[Alegreya] text-sm text-slate-500">{schoolName}</p>
              <Badge
                variant="outline"
                className={
                  isActive
                    ? "mt-2 border-emerald-500 text-emerald-600"
                    : hasMembership
                      ? "mt-2 border-amber-500 text-amber-600"
                      : "mt-2 border-red-500 text-red-600"
                }
              >
                {isActive ? "ACTIVE MEMBER" : hasMembership ? "EXPIRED MEMBERSHIP" : "NO MEMBERSHIP"}
              </Badge>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-left shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Alumni ID</p>
              <p className="font-mono text-sm font-semibold text-slate-900">{alumniId}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <CircleDollarSign className={`h-5 w-5 ${statusTone === "emerald" ? "text-emerald-500" : statusTone === "amber" ? "text-amber-500" : "text-red-500"}`} />
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Paid Status</p>
                <p className={`font-[Belleza] text-lg ${statusTone === "emerald" ? "text-emerald-600" : statusTone === "amber" ? "text-amber-600" : "text-red-600"}`}>
                  {paymentStatus}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              {isLifetime ? (
                <Infinity className="h-5 w-5 text-slate-500" />
              ) : (
                <Calendar className="h-5 w-5 text-slate-500" />
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Valid Till</p>
                <p className={`font-semibold font-[Alegreya] ${isActive ? "text-emerald-600" : hasMembership ? "text-amber-600" : "text-red-600"}`}>
                  {isLifetime ? "Lifetime" : hasMembership ? formatDate(member.membership_expiry) : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Building2 className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">School / Campus</p>
                <p className="font-semibold text-slate-900 font-[Alegreya]">{schoolName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <GraduationCap className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Graduation Year</p>
                <p className="font-semibold text-slate-900 font-[Alegreya]">{graduationYear}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
              <IdCard className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Membership Type</p>
                <p className="font-semibold text-slate-900 font-[Alegreya]">
                  {isLifetime ? "Lifetime Member" : member.membership_type === "annual" ? "Annual Member" : "No Membership"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
              <ShieldCheck className={`h-5 w-5 ${isActive ? "text-emerald-500" : hasMembership ? "text-amber-500" : "text-red-500"}`} />
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Current Access</p>
                <p className="font-semibold text-slate-900 font-[Alegreya]">
                  {isActive ? "Verified access granted" : "Access not active"}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-slate-400 text-xs italic font-[Belleza]">&quot;Once Students, Always Family&quot;</p>
            <p className="text-slate-500 text-xs mt-2 font-[Alegreya]">Verified by Light Alumni Connect</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
