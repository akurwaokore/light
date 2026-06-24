"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CvViewButton } from "@/components/careers/cv-view-button"
import { ApplicationChat } from "@/components/careers/application-chat"
import { Briefcase, Building2, MapPin, Clock, FileText, ChevronLeft, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useParams } from "next/navigation"

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
    description: string
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  reviewed: "bg-blue-100 text-blue-800 border-blue-200",
  interviewing: "bg-purple-100 text-purple-800 border-purple-200",
  offered: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function ApplicationDetailsPage() {
  const params = useParams()
  const id = params.id as string
  
  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) fetchApplicationDetails()
  }, [id])

  const fetchApplicationDetails = async () => {
    try {
      setIsLoading(true)
      // For now we use the list API and filter, or we could have a specific details API
      const response = await fetch("/api/jobs/my-applications")
      if (!response.ok) throw new Error("Failed to load application details")
      const data = await response.json()
      const found = (data.applications || []).find((app: Application) => app.id === id)
      
      if (!found) throw new Error("Application not found")
      setApplication(found)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading application details...</p>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Application not found"}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/careers/my-applications">Back to My Applications</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/careers/my-applications" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {application.job?.logo_url ? (
                    <img 
                      src={application.job.logo_url} 
                      alt={application.job.company} 
                      className="h-full w-full object-contain p-1"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold">{application.job?.title}</h1>
                  <p className="text-lg text-muted-foreground">{application.job?.company}</p>
                </div>
              </div>
              <Badge className={`${statusColors[application.status] || "bg-gray-100 text-gray-800"} border capitalize px-4 py-1 text-sm`}>
                {application.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {application.job?.location}
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {application.job?.employment_type?.replace("-", " ")}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Applied on {new Date(application.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-bold text-lg">Job Description</h3>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {application.job?.description}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cover Letter</h4>
                <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap italic">
                  "{application.cover_letter || "No cover letter provided."}"
                </div>
              </div>

              {((application as any).cv_id || (application.cv_url && application.cv_url !== "pending")) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Attached CV</h4>
                  <CvViewButton cvId={(application as any).cv_id} cvUrl={application.cv_url} label="View Submitted CV" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 flex h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-bold">Application Submitted</p>
                    <p className="text-xs text-muted-foreground">{new Date(application.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {application.status !== 'pending' && (
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-bold">Status Updated to {application.status}</p>
                      <p className="text-xs text-muted-foreground">Recent activity</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages with the employer</CardTitle>
              <CardDescription>Direct line with the job poster about this application.</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationChat applicationId={application.id} />
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
              <CardDescription>Questions about your application?</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/support">Contact Support</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
