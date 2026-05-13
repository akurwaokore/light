import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, XCircle, Calendar, GraduationCap, Building2, Award as IdCard, Infinity } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <CardHeader className={`text-center ${isActive ? "bg-emerald-600" : "bg-red-600"} text-white`}>
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
          <p className="text-white/80 text-sm mt-1 font-[Alegreya]">Light Alumni Connect Membership Verification</p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Status Message */}
          {!isActive && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 font-bold text-lg font-[Belleza]">
                {hasMembership ? "This membership has expired." : "This person does not have a membership."}
              </p>
              <p className="text-red-600 text-sm mt-1 font-[Alegreya]">
                Please contact Light Alumni Connect for verification.
              </p>
            </div>
          )}

          {/* Member Profile */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-slate-200">
              <AvatarImage src={member.photo_url || undefined} />
              <AvatarFallback className="bg-slate-200 text-slate-600 text-2xl">
                {member.display_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-[Belleza]">{member.display_name}</h2>
              <Badge
                variant="outline"
                className={isActive ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600"}
              >
                {isActive ? "ACTIVE MEMBER" : hasMembership ? "EXPIRED" : "NO MEMBERSHIP"}
              </Badge>
            </div>
          </div>

          {/* Member Details */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <IdCard className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Alumni ID</p>
                <p className="font-mono font-semibold text-slate-900">{alumniId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Building2 className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">School / Campus</p>
                <p className="font-semibold text-slate-900 font-[Alegreya]">{member.campus || "Light Academy"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <GraduationCap className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Graduation Year</p>
                <p className="font-semibold text-slate-900 font-[Alegreya]">{member.graduation_year || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              {isLifetime ? (
                <Infinity className="h-5 w-5 text-slate-500" />
              ) : (
                <Calendar className="h-5 w-5 text-slate-500" />
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  {isLifetime ? "Membership Type" : "Membership Expiry"}
                </p>
                <p className={`font-semibold font-[Alegreya] ${isActive ? "text-emerald-600" : "text-red-600"}`}>
                  {isLifetime ? "Lifetime Member" : hasMembership ? formatDate(member.membership_expiry) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Membership Type Badge */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Membership Type</p>
            <Badge variant="secondary" className="text-sm px-4 py-1 font-[Belleza]">
              {isLifetime ? "Lifetime Member" : member.membership_type === "annual" ? "Annual Member" : "No Membership"}
            </Badge>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-slate-400 text-xs italic font-[Belleza]">&quot;Once Students, Always Family&quot;</p>
            <p className="text-slate-500 text-xs mt-2 font-[Alegreya]">Verified by Light Alumni Connect</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
