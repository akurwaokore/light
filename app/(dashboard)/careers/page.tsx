"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  DollarSign,
  Upload,
  FileText,
  Search,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlumniCVForm } from "@/components/careers/cv-form"
import { ApplyModal } from "@/components/careers/apply-modal"

const jobPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  company: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Location is required"),
  employment_type: z.enum(["full-time", "part-time", "contract", "internship"]),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  experience_level: z.enum(["entry", "mid", "senior", "executive"]),
  skills: z.string().optional(),
  logo_url: z.string().optional(),
})

type JobPostForm = z.infer<typeof jobPostSchema>

interface Job {
  id: string
  title: string
  company: string
  description: string
  location: string
  logo_url?: string
  status: string
  posted_by: string
  employment_type: string
  salary_min: number | null
  salary_max: number | null
  currency: string
  created_at: string
  category: { name: string } | null
  poster: { display_name: string; photo_url: string } | null
}

interface JobCategory {
  id: string
  name: string
}

const typeColors = {
  "full-time": "bg-green-100 text-green-800",
  "part-time": "bg-blue-100 text-blue-800",
  contract: "bg-orange-100 text-orange-800",
  internship: "bg-purple-100 text-purple-800",
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [categories, setCategories] = useState<JobCategory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState("")
  const [error, setError] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [isUploadingCv, setIsUploadingCv] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<JobPostForm>({
    resolver: zodResolver(jobPostSchema),
  })

  useEffect(() => {
    fetchJobs()
    fetchCategories()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    const response = await fetch("/api/auth/me")
    if (response.ok) {
      const data = await response.json()
      setCurrentUserId(data.user?.id)
    }
  }

  const fetchJobs = async (search?: string) => {
    try {
      setIsLoadingJobs(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/jobs?${params}`)
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs || [])
      } else {
        setError("Failed to load jobs")
      }
    } catch (err) {
      setError("Failed to load jobs")
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/jobs/categories")
      const data = await response.json()

      if (response.ok) {
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error("Failed to load categories")
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchJobs(searchQuery)
      } else {
        fetchJobs()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatSalary = (min: number | null, max: number | null, currency = "KES") => {
    if (!min && !max) return null
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
    if (min) return `From ${currency} ${min.toLocaleString()}`
    if (max) return `Up to ${currency} ${max.toLocaleString()}`
    return null
  }

  const onSubmitJob = async (data: JobPostForm) => {
    setIsSubmitting(true)
    setError("")

    try {
      const skills = data.skills ? data.skills.split(",").map((s) => s.trim()) : []

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          skills,
          salary_min: data.salary_min ? Number.parseFloat(data.salary_min) : null,
          salary_max: data.salary_max ? Number.parseFloat(data.salary_max) : null,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const postedStatus = result?.job?.status
        if (postedStatus === "pending_approval") {
          setSubmissionMessage("Job posted successfully and sent for admin approval.")
        } else {
          setSubmissionMessage("Job posted successfully and is now live.")
        }
        setIsSubmitted(true)
        reset()
        fetchJobs() // Refresh jobs list
        setTimeout(() => setIsSubmitted(false), 3000)
      } else {
        setError(result.error || "Failed to post job")
      }
    } catch (err) {
      setError("Failed to post job. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }
      setCvFile(file)
      setError("")
    }
  }

  const handleCvSubmit = async () => {
    if (!cvFile) return

    setIsUploadingCv(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("cv", cvFile)

      const response = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        setCvFile(null)
        setTimeout(() => setIsSubmitted(false), 3000)
      } else {
        setError(result.error || "Failed to upload CV")
      }
    } catch (err) {
      setError("Failed to upload CV. Please try again.")
    } finally {
      setIsUploadingCv(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold">Career Hub</h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">Find opportunities and connect with alumni employers</p>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6" key="careers-tabs">
        <TabsList>
          <TabsTrigger value="jobs">
            <Briefcase className="mr-2 h-4 w-4" />
            Job Board
          </TabsTrigger>
          <TabsTrigger value="submit-cv">
            <FileText className="mr-2 h-4 w-4" />
            Submit CV
          </TabsTrigger>
          <TabsTrigger value="post-job">
            <Plus className="mr-2 h-4 w-4" />
            Post a Job
          </TabsTrigger>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/careers/my-listings" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                My Listings
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/careers/my-applications" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Applications
              </Link>
            </Button>
          </div>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading State */}
          {isLoadingJobs && (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading jobs...</p>
            </div>
          )}

          {/* Jobs List */}
          {!isLoadingJobs && jobs.length > 0 && (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="transition-all hover:border-primary/50 hover:shadow-md overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                          {job.logo_url ? (
                            <img src={job.logo_url} alt={job.company} className="h-full w-full object-contain p-1" crossOrigin="anonymous" />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-serif text-xl font-semibold">{job.title}</h3>
                          <Badge
                            variant="secondary"
                            className={typeColors[job.employment_type as keyof typeof typeColors]}
                          >
                            {job.employment_type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                          {job.status === "pending_approval" && (
                            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                              Pending Approval
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          {formatSalary(job.salary_min, job.salary_max, job.currency) && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatSalary(job.salary_min, job.salary_max, job.currency)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTimeAgo(job.created_at)}
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-muted-foreground">{job.description}</p>
                        {job.poster && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Posted by <span className="font-medium text-foreground">{job.poster.display_name}</span>
                          </p>
                        )}
                      </div>
                      </div>
                      <Button onClick={() => setSelectedJobToApply(job)}>Apply Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <ApplyModal 
            job={selectedJobToApply} 
            isOpen={!!selectedJobToApply} 
            onClose={() => setSelectedJobToApply(null)} 
          />

          {/* Empty State */}
          {!isLoadingJobs && jobs.length === 0 && (
            <div className="py-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">No jobs found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search terms" : "No jobs are currently available"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="submit-cv">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-serif font-bold">Alumni CV & Profile</h2>
              <p className="text-sm md:text-base text-muted-foreground">To maintain a structured and searchable alumni database, please follow the guidelines below when uploading your CV.</p>
            </div>
            <AlumniCVForm />
          </div>
        </TabsContent>

        <TabsContent value="post-job">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Post a Job Opportunity</CardTitle>
                <CardDescription>Share job openings with the alumni community</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isSubmitted && submissionMessage && (
                  <Alert className="mb-6">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{submissionMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmitJob)} className="space-y-6">
                  <div className="space-y-4 mb-6">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                        {register("logo_url") ? (
                          /* @ts-ignore */
                          <img src={register("logo_url").value || "/placeholder.jpg"} alt="Logo Preview" className="h-full w-full object-contain p-1" id="logo-preview" />
                        ) : (
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const formData = new FormData()
                            formData.append("file", file)
                            formData.append("path", "jobs/logos")
                            const res = await fetch("/api/cms/upload", { method: "POST", body: formData })
    if (res.ok) {
      const { url } = await res.json()
      setValue("logo_url", url)
      const preview = document.getElementById('logo-preview') as HTMLImageElement
      if (preview) {
        preview.src = url
        preview.crossOrigin = "anonymous"
      }
    }
                          }}
                        />
                        <p className="text-[10px] text-muted-foreground">Square logo recommended.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input id="title" placeholder="e.g., Senior Software Developer" {...register("title")} />
                      {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" placeholder="Company name" {...register("company")} />
                      {errors.company && <p className="text-sm text-destructive">{errors.company.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" placeholder="e.g., Nairobi, Kenya" {...register("location")} />
                      {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employment_type">Job Type</Label>
                      <Select
                        onValueChange={(value: "full-time" | "part-time" | "contract" | "internship") =>
                          setValue("employment_type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.employment_type && (
                        <p className="text-sm text-destructive">{errors.employment_type.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category_id">Category</Label>
                      <Select onValueChange={(value) => setValue("category_id", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience_level">Experience Level</Label>
                      <Select
                        onValueChange={(value: "entry" | "mid" | "senior" | "executive") =>
                          setValue("experience_level", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.experience_level && (
                        <p className="text-sm text-destructive">{errors.experience_level.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="salary_min">Minimum Salary (Optional)</Label>
                      <Input id="salary_min" type="text" placeholder="50000" {...register("salary_min")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary_max">Maximum Salary (Optional)</Label>
                      <Input id="salary_max" type="text" placeholder="80000" {...register("salary_max")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Required Skills (comma separated)</Label>
                    <Input id="skills" placeholder="e.g., JavaScript, React, Node.js" {...register("skills")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the role and what makes it exciting..."
                      className="min-h-[100px]"
                      {...register("description")}
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements (Optional)</Label>
                    <Textarea
                      id="requirements"
                      placeholder="List the requirements for this position..."
                      className="min-h-[80px]"
                      {...register("requirements")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsibilities">Responsibilities (Optional)</Label>
                    <Textarea
                      id="responsibilities"
                      placeholder="Describe key responsibilities..."
                      className="min-h-[80px]"
                      {...register("responsibilities")}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : isSubmitted ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Posted Successfully!
                      </>
                    ) : (
                      "Post Job"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
