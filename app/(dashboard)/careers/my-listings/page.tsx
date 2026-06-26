"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Briefcase,
  Building2,
  Clock,
  MapPin,
  Users,
  Loader2,
  AlertCircle,
  ArrowRight,
  Plus,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface JobListing {
  id: string
  title: string
  company: string
  location: string
  status: string
  created_at: string
  application_count: number
  employment_type: string
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<JobListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/jobs/my-listings")
      const data = await response.json()

      if (response.ok) {
        setListings(data.listings || [])
      } else {
        setError(data.error || "Failed to load your job listings")
      }
    } catch (err) {
      setError("An unexpected error occurred while loading listings")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "pending_approval":
        return <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Pending Approval</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">My Job Listings</h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">Manage your posted jobs and view applicants</p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/careers">
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Link>
        </Button>
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
          <p className="mt-4 text-muted-foreground">Loading your listings...</p>
        </div>
      ) : listings.length > 0 ? (
        <div className="grid gap-4">
          {listings.map((job) => (
            <Card key={job.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-xl font-semibold">{job.title}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Posted on {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center md:text-right">
                      <div className="flex items-center justify-center gap-1 text-lg font-bold md:justify-end">
                        <Users className="h-5 w-5 text-primary" />
                        {job.application_count}
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Applicants</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/careers/my-listings/${job.id}`}>
                        Manage
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No jobs posted yet</h3>
            <p className="max-w-xs text-muted-foreground">
              You haven't posted any job opportunities yet. Start by posting a job to reach the alumni community.
            </p>
            <Button asChild className="mt-6">
              <Link href="/careers">Post Your First Job</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
