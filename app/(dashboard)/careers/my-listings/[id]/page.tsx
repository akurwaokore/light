"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import {
  FileText,
  Mail,
  Calendar,
  ChevronLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Download,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Applicant {
  id: string
  display_name: string
  photo_url: string
  email: string
  full_name: string
  bio: string
}

interface Application {
  id: string
  job_id: string
  user_id: string
  status: string
  cv_url: string
  cover_letter: string
  created_at: string
  applicant: Applicant
}

export default function JobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchApplications()
  }, [id])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/jobs/${id}/applications`)
      const data = await response.json()

      if (response.ok) {
        setApplications(data || [])
      } else {
        setError(data.error || "Failed to load applicants")
      }
    } catch (err) {
      setError("An unexpected error occurred while loading applicants")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/careers/my-listings">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold">Applicants</h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">Review applications for your job posting</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading applicants...</p>
        </div>
      ) : applications.length > 0 ? (
        <div className="grid gap-6">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <Avatar className="h-16 w-16 border">
                    <AvatarImage src={app.applicant.photo_url} alt={app.applicant.display_name} />
                    <AvatarFallback>{app.applicant.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{app.applicant.full_name || app.applicant.display_name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {app.applicant.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Applied on {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={app.cv_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" />
                            View CV
                          </a>
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/profile/${app.applicant.id}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cover Letter</h4>
                      <p className="text-sm whitespace-pre-wrap">{app.cover_letter || "No cover letter provided."}</p>
                    </div>

                    {app.applicant.bio && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">About Applicant</h4>
                        <p className="text-sm line-clamp-2 text-muted-foreground">{app.applicant.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No applicants yet</h3>
            <p className="max-w-xs text-muted-foreground">
              Nobody has applied to this job yet. Try sharing the listing to get more visibility.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
