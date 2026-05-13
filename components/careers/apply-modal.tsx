"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, CheckCircle, Upload } from "lucide-react"
import { toast } from "sonner"
import { useProfile } from "@/hooks/use-profile"

interface CV {
  id: string
  file_url: string
  file_name: string
  created_at: string
}

interface ApplyModalProps {
  job: any
  isOpen: boolean
  onClose: () => void
}

export function ApplyModal({ job, isOpen, onClose }: ApplyModalProps) {
  const { profile } = useProfile()
  const [cvs, setCvs] = useState<CV[]>([])
  const [selectedCv, setSelectedCv] = useState<string>("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoadingCvs, setIsLoadingCvs] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCvs()
    }
  }, [isOpen])

  const fetchCvs = async () => {
    setIsLoadingCvs(true)
    try {
      const res = await fetch("/api/members/me/cvs")
      if (res.ok) {
        const data = await res.json()
        setCvs(data.cvs || [])
        if (data.cvs?.length > 0) {
          setSelectedCv(data.cvs[0].id)
        }
      }
    } catch (err) {
      console.error("Error fetching CVs:", err)
    } finally {
      setIsLoadingCvs(false)
    }
  }

  const handleApply = async () => {
    if (isSubmitting) return

    let finalCvId = selectedCv

    if (!selectedCv && !cvFile) {
      toast.error("Please select or upload a CV")
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Upload CV if a file was selected directly in the modal
      if (cvFile) {
        const formData = new FormData()
        formData.append("file", cvFile)
        
        const cvData = {
          fullName: profile?.full_name || "Alumni User",
          email: profile?.email || "",
          graduationYear: profile?.graduation_year || "2024",
          education: [],
          workExperience: [],
          technicalSkills: [],
          soft_skills: [],
          languages: [],
          declaration: true
        }
        
        formData.append("data", JSON.stringify(cvData))
        
        const uploadRes = await fetch("/api/cv/upload", {
          method: "POST",
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload CV")
        }

        if (uploadData.cv_id) {
          finalCvId = uploadData.cv_id
        } else {
          // Fallback: Re-fetch CVs if for some reason ID wasn't returned
          try {
            const res = await fetch("/api/members/me/cvs")
            if (res.ok) {
              const data = await res.json()
              if (data.cvs?.length > 0) {
                // Find the one we just uploaded by name or just take the first
                finalCvId = data.cvs[0].id
              }
            }
          } catch (e) {
            console.error("Fallback fetch failed", e)
          }
        }
      }

      if (!finalCvId) {
        throw new Error("Could not retrieve CV ID for application")
      }

      // 2. Submit Job Application
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          cvId: finalCvId,
          coverLetter: coverLetter || "I am interested in this position."
        })
      })

      if (res.ok) {
        setIsSuccess(true)
        toast.success("Application submitted successfully!")
        setTimeout(() => {
          onClose()
          setIsSuccess(false)
          setCoverLetter("")
          setCvFile(null)
        }, 2000)
      } else {
        const err = await res.json().catch(() => ({}))
        const message = err?.details
          ? `${err.error || "Failed to submit application"}: ${err.details}`
          : err?.error || "Failed to submit application"
        toast.error(message)
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply for {job?.title}</DialogTitle>
          <DialogDescription>
            at {job?.company} • {job?.location}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="text-xl font-semibold">Application Sent!</h3>
            <p className="text-muted-foreground text-center">Your application has been submitted successfully to the employer.</p>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="cv-select">Select your CV</Label>
              {isLoadingCvs ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your CVs...
                </div>
              ) : cvs.length > 0 ? (
                <div className="space-y-4">
                  <Select value={selectedCv} onValueChange={(val) => { setSelectedCv(val); setCvFile(null); }}>
                    <SelectTrigger id="cv-select">
                      <SelectValue placeholder="Select a CV" />
                    </SelectTrigger>
                    <SelectContent>
                      {cvs.map((cv) => (
                        <SelectItem key={cv.id} value={cv.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{cv.file_name || "Resume"} ({new Date(cv.created_at).toLocaleDateString()})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-center text-xs text-muted-foreground">or</div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      title="Upload CV file"
                      aria-label="Upload CV file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCvFile(file);
                          setSelectedCv("");
                        }
                      }}
                      className="text-xs h-9 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 border-2 border-dashed rounded-lg bg-muted/20 text-center hover:bg-muted/30 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept=".pdf"
                      title="Upload CV file"
                      aria-label="Upload CV file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCvFile(file);
                          setSelectedCv("");
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <div className="text-sm font-medium">
                        {cvFile ? (
                          <span className="text-primary">{cvFile.name}</span>
                        ) : (
                          <span>Click to upload your CV (PDF)</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">No CVs found in your profile.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
              <Textarea
                id="cover-letter"
                placeholder="Tell the employer why you're a good fit..."
                className="min-h-[150px]"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
          </div>
        )}

        {!isSuccess && (
          <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={isSubmitting || (!selectedCv && !cvFile)} 
              className={`w-full sm:w-auto rounded-xl font-bold ${isSubmitting ? 'bg-muted' : 'bg-primary hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {cvFile ? "Uploading & Applying..." : "Sending Application..."}
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
