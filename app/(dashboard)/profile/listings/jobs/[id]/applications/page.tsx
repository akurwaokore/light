"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CvViewButton } from "@/components/careers/cv-view-button"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  ArrowLeft,
  Mail,
  FileText,
  Calendar,
  ExternalLink,
  CheckCircle,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"

export default function JobApplicationsPage() {
  const params = useParams()
  const jobId = params.id as string
  const [applications, setApplications] = useState<any[]>([])
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [jobId])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/profile/jobs/${jobId}/applications`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
        setJob(data.job)
      }
    } catch (error) {
      toast.error("Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      const response = await fetch(`/api/profile/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        setApplications(applications.map(a => a.id === appId ? { ...a, status } : a))
        toast.success(`Application marked as ${status}`)
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile/listings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-3xl font-bold">Applications for {job?.title}</h1>
          <p className="text-muted-foreground">{applications.length} candidates applied</p>
        </div>
      </div>

      <div className="space-y-4">
        {applications.length === 0 ? (
          <Card className="py-12 text-center text-muted-foreground">
             No applications received for this position yet.
          </Card>
        ) : (
          applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {app.applicant?.display_name?.[0] || 'A'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{app.applicant?.display_name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {app.applicant?.email}
                        </p>
                      </div>
                      <Badge className="capitalize">{app.status}</Badge>
                    </div>

                    {app.cover_letter && (
                      <div className="bg-muted/50 p-4 rounded-lg text-sm">
                        <p className="font-semibold mb-1">Cover Letter:</p>
                        <p>{app.cover_letter}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Applied on {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <CvViewButton cvId={(app as any).cv_id} cvUrl={app.cv_url} label="View CV" />

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(app.id, 'shortlisted')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Shortlist
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
