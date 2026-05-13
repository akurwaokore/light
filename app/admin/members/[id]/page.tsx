"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Mail, MapPin, Calendar, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface MemberProfile {
  id: string
  display_name: string
  email: string
  photo_url: string
  bio: string
  location: string
  is_admin: boolean
  created_at: string
}

import { use } from "react"

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [member, setMember] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch(`/api/admin/members/${id}`)
        if (!res.ok) throw new Error("Member not found")
        const data = await res.json()
        setMember(data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMember()
  }, [id, toast])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Member not found</h2>
        <Button asChild variant="outline">
          <Link href="/admin/members">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/members">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="font-heading text-3xl font-bold">Member Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={member.photo_url || ""} alt={member.display_name} />
                <AvatarFallback>{member.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{member.display_name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              {member.is_admin ? (
                <Badge className="bg-primary">Admin</Badge>
              ) : (
                <Badge variant="secondary">Member</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{member.email}</span>
            </div>
            {member.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{member.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Content Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
              <p className="text-sm">{member.bio || "No bio provided."}</p>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Roles & Permissions</h3>
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border italic text-sm">
                <Shield className="h-4 w-4" />
                <span>Role assignment for individual users is under development.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
