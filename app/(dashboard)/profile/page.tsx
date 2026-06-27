"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MembershipCard } from "@/components/membership/membership-card"
import { getNormalizedMembership } from "@/lib/membership"
import { PointsCard } from "@/components/profile/points-card"
import { MpesaCheckout } from "@/components/payments/mpesa-checkout"
import { ImageCropper } from "@/components/ui/image-cropper"
import {
  User,
  Briefcase,
  MapPin,
  Phone,
  Linkedin,
  Mail,
  Camera,
  Heart,
  Loader2,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  Infinity,
  X,
  UserCheck,
  Users,
  ShoppingBag
} from "lucide-react"
import Link from "next/link"

const profileSchema = z.object({
  displayName: z.string().min(2, "Please add the required info (at least 2 characters)"),
  phone: z.string().min(1, "Please add the required info").nullable().or(z.literal("")),
  bio: z.string().max(500, "Bio must be 500 characters or less").min(1, "Please add the required info").nullable().or(z.literal("")),
  jobTitle: z.string().min(1, "Please add the required info").nullable().or(z.literal("")),
  company: z.string().min(1, "Please add the required info").nullable().or(z.literal("")),
  location: z.string().min(1, "Please add the required info").nullable().or(z.literal("")),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  linkedIn: z.string().url("Please enter a valid URL").min(1, "Please add the required info").nullable().or(z.literal("")),
  status: z.enum(["studying", "working", "retired", "other"]).nullable().optional(),
  graduationYear: z.string().min(1, "Please add the required info").nullable().or(z.literal("")),
  campus: z.string().min(1, "Please add the required info").nullable().or(z.literal("")),
  openToWork: z.boolean().optional(),
  friendsVisibility: z.enum(["public", "friends", "private"]).optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const campuses = [
  "Light Academy Nairobi", 
  "Light International Nairobi", 
  "Light Nairobi Girls", 
  "Light International Primary", 
  "Light International Malindi", 
  "Light Academy Mombasa", 
  "Light International Mombasa"
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 40 }, (_, i) => currentYear - i)

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSaved, setIsSaved] = useState(false)
  const [showMpesa, setShowMpesa] = useState(false)
  const [cropperImage, setCropperImage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    fetchProfileAndTransactions()
  }, [])

  const fetchProfileAndTransactions = async () => {
    try {
      const [profileRes, transRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/profile/transactions")
      ])
      
      const profileData = await profileRes.json()
      const transData = await transRes.json()
      
      if (profileData && !profileData.error) {
        setProfile(profileData)
        reset({
          displayName: profileData.display_name || "",
          phone: profileData.phone || "",
          bio: profileData.bio || "",
          jobTitle: profileData.job_title || "",
          company: profileData.company || "",
          location: profileData.location || "",
          country: profileData.country || "",
          city: profileData.city || "",
          linkedIn: profileData.linkedin || "",
          status: profileData.status || null,
          graduationYear: profileData.graduation_year?.toString() || "",
          campus: profileData.campus || "",
          openToWork: !!profileData.open_to_work,
          friendsVisibility: profileData.friends_visibility || "friends",
        })
      }
      
      if (Array.isArray(transData)) {
        setTransactions(transData)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: data.displayName,
          phone: data.phone || null,
          bio: data.bio || null,
          jobTitle: data.jobTitle || null,
          company: data.company || null,
          location: data.location || null,
          country: data.country || null,
          city: data.city || null,
          linkedIn: data.linkedIn || null,
          status: data.status || null,
          graduationYear: data.graduationYear ? parseInt(data.graduationYear.toString()) : null,
          campus: data.campus || null,
          openToWork: !!data.openToWork,
          friends_visibility: data.friendsVisibility || "friends"
        })
      })

      if (response.ok) {
        setProfile({ ...profile, ...data, open_to_work: data.openToWork, friends_visibility: data.friendsVisibility })
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 3000)
      } else {
        const errData = await response.json()
        setError(errData.error || "Failed to update profile")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getMembershipStatus = () => {
    const normalized = getNormalizedMembership(profile)
    if (!normalized.hasMembership) return null

    return {
      type: normalized.type,
      tier: normalized.tier,
      isLifetime: normalized.isLifetime,
      isActive: normalized.isActive,
      expiryDate: normalized.expiryDate,
      startDate: normalized.startDate,
    }
  }

  const membershipStatus = getMembershipStatus()

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load profile. Please try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-[Belleza] text-2xl sm:text-3xl font-bold">My Profile</h1>
            <div className="flex gap-2">
              {profile?.is_hiring && (
                <Badge className="bg-blue-600 text-white animate-pulse">Hiring</Badge>
              )}
              {profile?.open_to_work && (
                <Badge variant="secondary" className="bg-green-600 text-white">Open to Work</Badge>
              )}
            </div>
          </div>
          <p className="mt-1 text-muted-foreground font-[Alegreya]">Manage your profile information and membership</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">My Activity</TabsTrigger>
          <TabsTrigger value="membership">Membership Card</TabsTrigger>
          <TabsTrigger value="transactions">Spending History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-[Belleza]">Profile Photo</CardTitle>
              <CardDescription className="font-[Alegreya]">Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <Avatar className="h-24 w-24 shrink-0">
                <AvatarImage src={profile.photo_url || "/placeholder.svg"} alt={profile.display_name} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="file"
                    className="hidden"
                    id="photo-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () => {
                          setCropperImage(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />

                  {cropperImage && (
                    <ImageCropper
                      imageSrc={cropperImage}
                      aspect={1}
                      circularCrop={true}
                      onCancel={() => setCropperImage(null)}
                      onCropComplete={async (blob: Blob) => {
                        setCropperImage(null)
                        setIsLoading(true)
                        
                        const formData = new FormData()
                        formData.append("file", blob, "profile.jpg")
                        formData.append("path", "profiles")
                        
                        try {
                          const res = await fetch("/api/upload", {
                            method: "POST",
                            body: formData
                          })
                          const data = await res.json()
                          if (data.url) {
                            await fetch("/api/profile", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ photo_url: data.url })
                            })
                            setProfile({ ...profile, photo_url: data.url })
                            setIsSaved(true)
                            setTimeout(() => setIsSaved(false), 3000)
                          }
                        } catch (err) {
                          setError("Failed to upload photo")
                        } finally {
                          setIsLoading(false)
                        }
                      }}
                    />
                  )}

                  <Button variant="outline" asChild>
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Camera className="mr-2 h-4 w-4" />
                      Change Photo
                    </label>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground font-[Alegreya]">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSaved && (
            <Alert className="border-green-600 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 font-bold">Profile updated successfully!</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="font-[Belleza]">Personal Information</CardTitle>
                <CardDescription className="font-[Alegreya]">Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="font-[Alegreya]">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="displayName" className="pl-10" {...register("displayName")} />
                    </div>
                    {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-[Alegreya]">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="email" type="email" className="pl-10" value={profile.email} disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-[Alegreya]">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="phone" className="pl-10" placeholder="+254 712 345 678" {...register("phone")} />
                    </div>
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedIn" className="font-[Alegreya]">
                      LinkedIn Profile
                    </Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="linkedIn"
                        className="pl-10"
                        placeholder="https://linkedin.com/in/yourprofile"
                        {...register("linkedIn")}
                      />
                    </div>
                    {errors.linkedIn && <p className="text-sm text-destructive">{errors.linkedIn.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-[Alegreya]">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px]"
                    {...register("bio")}
                  />
                  {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear" className="font-[Alegreya]">
                      Graduation Year
                    </Label>
                    <Select
                      defaultValue={profile.graduation_year?.toString()}
                      onValueChange={(value) => setValue("graduationYear", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.graduationYear && <p className="text-sm text-destructive">{errors.graduationYear.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="campus" className="font-[Alegreya]">
                        Campus
                      </Label>
                      {profile?.is_admin && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] uppercase font-bold text-primary"
                          onClick={() => alert("Manage campuses in CMS Admin settings")}
                        >
                          + Add New
                        </Button>
                      )}
                    </div>
                    <Select defaultValue={profile.campus} onValueChange={(value) => setValue("campus", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campus" />
                      </SelectTrigger>
                      <SelectContent>
                        {campuses.map((campus) => (
                          <SelectItem key={campus} value={campus}>
                            {campus}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.campus && <p className="text-sm text-destructive">{errors.campus.message}</p>}
                  </div>
                </div>

                <Separator />

                <h3 className="font-semibold font-[Belleza]">Professional Information</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="font-[Alegreya]">
                      Current Status
                    </Label>
                    <Select
                      defaultValue={profile.status}
                      onValueChange={(value: "studying" | "working" | "retired" | "other") => setValue("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studying">Currently Studying</SelectItem>
                        <SelectItem value="working">Working Professional</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="font-[Alegreya]">
                      Job Title
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="jobTitle"
                        className="pl-10"
                        placeholder="Software Engineer"
                        {...register("jobTitle")}
                      />
                    </div>
                    {errors.jobTitle && <p className="text-sm text-destructive">{errors.jobTitle.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="font-[Alegreya]">
                      Company
                    </Label>
                    <Input id="company" placeholder="Company name" {...register("company")} />
                    {errors.company && <p className="text-sm text-destructive">{errors.company.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-[Alegreya]">
                      Location
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="location" className="pl-10" placeholder="Nairobi, Kenya" {...register("location")} />
                    </div>
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                  </div>
                </div>

                <Separator />

                <div className="p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        Available for Work
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add an "Open to Work" badge to your profile to let recruiters know you are searching.
                      </p>
                    </div>
                    <div 
                      className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${watch("openToWork") ? 'bg-green-600' : 'bg-slate-300'}`}
                      onClick={() => setValue("openToWork", !watch("openToWork"))}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${watch("openToWork") ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="font-[Alegreya] flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Who can see my friends list
                  </Label>
                  <Select
                    defaultValue={profile.friends_visibility || "friends"}
                    onValueChange={(value: "public" | "friends" | "private") => setValue("friendsVisibility", value)}
                  >
                    <SelectTrigger className="md:max-w-sm">
                      <SelectValue placeholder="Select who can see your friends" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Everyone (Public)</SelectItem>
                      <SelectItem value="friends">Friends only</SelectItem>
                      <SelectItem value="private">Only me (Private)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Controls whether other alumni can browse your friends from your profile.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto sm:min-w-[150px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => reset()}>
                Cancel
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="font-[Belleza]">My Community Activity</CardTitle>
               <CardDescription>Your marketplace listings and job postings</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Marketplace Listings</p>
                        <p className="text-xs text-muted-foreground">Manage your products and services</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/profile/listings">Manage</Link>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Job Openings</p>
                        <p className="text-xs text-muted-foreground">Track your recruitment and applications</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/profile/listings?tab=jobs">View Jobs</Link>
                    </Button>
                  </div>
               </div>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="membership" className="space-y-6">
          <Card className={membershipStatus?.isActive ? "border-emerald-500/30" : "border-muted"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-[Belleza]">
                <CreditCard className="h-5 w-5" />
                Membership Status
              </CardTitle>
              <CardDescription className="font-[Alegreya]">
                {membershipStatus
                  ? `Your ${membershipStatus.isLifetime ? "Lifetime" : "Annual"} membership`
                  : "You don't have an active membership"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membershipStatus ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {membershipStatus.isLifetime ? (
                        <Infinity className="h-6 w-6 text-primary shrink-0" />
                      ) : (
                        <Calendar className="h-6 w-6 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold font-[Belleza]">
                          {membershipStatus.isLifetime ? "Lifetime" : "Annual"} Membership
                        </p>
                        <p className="text-sm text-muted-foreground font-[Alegreya]">
                          Started: {membershipStatus.startDate?.toLocaleDateString() || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <Badge className={membershipStatus.isActive ? "bg-emerald-500" : "bg-red-500"}>
                        {membershipStatus.isActive ? "Active" : "Expired"}
                      </Badge>
                      {!membershipStatus.isLifetime && (
                        <p className="text-sm text-muted-foreground mt-1 font-[Alegreya]">
                          {membershipStatus.isActive
                            ? `Expires: ${membershipStatus.expiryDate?.toLocaleDateString()}`
                            : `Expired: ${membershipStatus.expiryDate?.toLocaleDateString()}`}
                        </p>
                      )}
                      {membershipStatus.isLifetime && (
                        <p className="text-sm text-emerald-600 mt-1 font-[Alegreya]">Never expires</p>
                      )}
                    </div>
                  </div>

                  {!membershipStatus.isActive && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-[Alegreya]">
                        Your membership has expired.{" "}
                        <Link href="/payments" className="underline font-semibold">
                          Renew now
                        </Link>{" "}
                        to regain access to all benefits.
                      </AlertDescription>
                    </Alert>
                  )}

                  {showMpesa && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                      <div className="relative w-full max-w-md">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-2 z-10"
                          onClick={() => setShowMpesa(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <MpesaCheckout 
                          amount={1000} 
                          description="Membership Renewal" 
                          onSuccess={() => {
                            setShowMpesa(false)
                            fetchProfileAndTransactions()
                          }}
                          onCancel={() => setShowMpesa(false)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold font-[Belleza]">No Active Membership</h3>
                  <p className="text-muted-foreground mt-1 font-[Alegreya]">
                    Go to the subscription page to activate your card and manage your membership plan.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/payments">Open Subscription Page</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="font-[Belleza]">Digital Membership Card</CardTitle>
              <CardDescription className="font-[Alegreya]">
                {membershipStatus?.isActive
                  ? "Download or add your card to Apple/Google Wallet"
                  : "Your card will be activated once you have an active membership"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembershipCard
                member={{
                  ...profile,
                  membership_tier: profile.membership_tier,
                  membership_type: profile.membership_type,
                  membership_start_date: profile.membership_start_date,
                  membership_expiry: profile.membership_expiry,
                }}
              />
            </CardContent>
          </Card>

          <PointsCard userId={profile.id} initialPoints={0} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-[Belleza]">
                <CreditCard className="h-5 w-5 text-primary" />
                Spending History
              </CardTitle>
              <CardDescription className="font-[Alegreya]">View all your memberships and donations</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground font-[Alegreya]">No transactions found yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold font-[Belleza] capitalize truncate">{tx.description || tx.type}</p>
                          <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] h-4">
                            {tx.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-[Alegreya]">
                          {new Date(tx.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })} • {tx.payment_method?.toUpperCase()}
                        </p>
                      </div>
                      <p className="font-bold text-primary font-[Belleza] shrink-0">
                        {tx.currency || 'KES'} {tx.amount?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {transactions.length > 0 && (
                <div className="mt-6 rounded-lg bg-primary/5 p-4 border border-primary/10">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold font-[Belleza] text-primary">Total Spend</p>
                    <p className="text-2xl font-bold text-primary font-[Belleza]">
                      KES {transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
