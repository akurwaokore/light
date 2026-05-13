// Job and CV matching system types
export type JobStatus = "draft" | "pending_approval" | "active" | "closed" | "rejected"
export type CVStatus = "active" | "inactive" | "archived"
export type ExperienceLevel = "entry" | "mid" | "senior" | "executive"
export type ApplicationStatus = "pending" | "reviewed" | "shortlisted" | "rejected" | "hired"

export interface JobCategory {
  id: string
  name: string
  description?: string
  icon?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface JobListing {
  id: string
  poster_id: string
  poster_name: string
  poster_email: string
  company: string
  title: string
  description: string
  requirements: string[]
  responsibilities: string[]
  location: string
  type: "full-time" | "part-time" | "contract" | "internship"
  salary_range?: string
  category_id: string
  experience_level: ExperienceLevel
  skills_required: string[]
  benefits?: string[]
  application_deadline?: string
  status: JobStatus
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  views: number
  applications_count: number
  created_at: string
  updated_at: string
}

export interface CV {
  id: string
  user_id: string
  user_name: string
  user_email: string
  file_url?: string
  file_name?: string
  parsed_text?: string
  skills: string[]
  experience_level: ExperienceLevel
  education: string[]
  work_experience: string[]
  certifications: string[]
  languages: string[]
  summary?: string
  preferred_job_type?: string[]
  preferred_location?: string
  preferred_salary_range?: string
  status: CVStatus
  profile_completion: number
  created_at: string
  updated_at: string
}

export interface JobMatch {
  id: string
  cv_id: string
  job_id: string
  match_score: number
  matching_skills: string[]
  missing_skills: string[]
  match_reasons: string[]
  ai_recommendation: string
  notified: boolean
  created_at: string
}

export interface JobApplication {
  id: string
  job_id: string
  applicant_id: string
  applicant_name: string
  cv_id: string
  cover_letter?: string
  status: ApplicationStatus
  reviewed_by?: string
  reviewed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}
