"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, Building2, MapPin, Clock, FileText, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Application {
  id: string
  job_id: string
  status: string
  created_at: string
  cover_letter?: string
  cv_url?: string
  job: {
    id: string
    title: string
    company: string
    location: string
    logo_url?: string
    employment_type: string
    currency: string
    salary_min?: number
    salary_max?: number
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  reviewed: "bg-blue-100 text-blue-800 border-blue-200",
  shortlisted: "bg-indigo-100 text-indigo-800 border-indigo-200",
  interview_scheduled: "bg-purple-100 text-purple-800 border-purple-200",
  interviewing: "bg-purple-100 text-purple-800 border-purple-200",
  interviewed: "bg-purple-100 text-purple-800 border-purple-200",
  offer_extended: "bg-emerald-100 text-emerald-800 border-emerald-200",
  offered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  offer_accepted: "bg-green-100 text-green-800 border-green-200",
  offer_declined: "bg-orange-100 text-orange-800 border-orange-200",
  hired: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  interviewing: "Interviewing",
  interviewed: "Interviewed",
  offer_extended: "Offer Extended",
  offered: "Offer Extended",
  offer_accepted: "Offer Accepted",
  offer_declined: "Offer Declined",
  hired: "Hired",
  rejected: "Not Selected",
  withdrawn: "Withdrawn",
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/jobs/my-applications")
      if (!response.ok) throw new Error("Failed to load applications")
      const data = await response.json()
      setApplications(data.applications || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your applications...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">My Applications</h1>
          <p className="text-muted-foreground">Track the status of your job applications</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/careers">Back to Job Board</Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">No applications yet</h3>
              <p className="text-muted-foreground">You haven't applied for any jobs yet.</p>
            </div>
            <Button asChild>
              <Link href="/careers">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <Card key={app.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Job Info */}
                  <div className="flex-1 p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {app.job?.logo_url ? (
                          <img 
                            src={app.job.logo_url} 
                            alt={app.job.company} 
                            className="h-full w-full object-contain p-1"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-serif text-lg font-bold leading-none truncate">{app.job?.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground truncate">{app.job?.company}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {app.job?.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        Applied on {formatTimeAgo(app.created_at)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        {app.job?.employment_type?.replace("-", " ")}
                      </div>
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="bg-muted/30 md:w-64 p-5 flex flex-row md:flex-col justify-between md:justify-center items-center gap-4 border-t md:border-t-0 md:border-l">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 md:block hidden">Current Status</p>
                      <Badge className={`${statusColors[app.status] || "bg-gray-100 text-gray-800"} border px-3 py-1`}>
                        {statusLabels[app.status] || app.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 group md:w-full" asChild>
                      <Link href={`/careers/my-applications/${app.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
