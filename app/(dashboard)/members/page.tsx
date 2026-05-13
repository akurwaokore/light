"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Users, MapPin, GraduationCap } from "lucide-react"
import Link from "next/link"

interface Member {
  id: string
  display_name: string
  photo_url: string | null
  campus: string | null
  graduation_year: number | null
  job_title: string | null
  company: string | null
}

export default function MembersDirectoryPage() {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter((member) =>
    member.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.campus?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Members Directory</h1>
        <p className="mt-1 text-muted-foreground">Find and connect with fellow Light Academy alumni</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, campus, job title, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMembers.map((member) => (
          <Link href={`/members/${member.id}`} key={member.id}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={member.photo_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {member.display_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 font-semibold hover:underline">{member.display_name}</h3>
                  <p className="mt-1 text-sm font-medium text-primary">
                    {member.job_title || "Alumni"}
                  </p>
                  {member.company && (
                    <p className="text-xs text-muted-foreground">at {member.company}</p>
                  )}
                  
                  <div className="mt-4 w-full space-y-2">
                    {member.campus && (
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{member.campus}</span>
                      </div>
                    )}
                    {member.graduation_year && (
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <GraduationCap className="h-3 w-3" />
                        <span>Class of {member.graduation_year}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No members found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search terms</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
