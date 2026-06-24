export type NormalizedJobApplication = {
  id: string
  job_id: string
  user_id: string
  status: string
  cv_url: string | null
  cv_id: string | null
  cover_letter: string
  created_at: string
  updated_at: string | null
  applicant: {
    id: string | null
    display_name: string
    email: string | null
    photo_url: string | null
    full_name: string | null
    bio: string | null
  }
  job?: {
    id: string
    title: string
    company: string
    location: string
    logo_url: string | null
    employment_type: string | null
    currency: string | null
    salary_min: number | null
    salary_max: number | null
    posted_by?: string | null
  } | null
}

export function normalizeJobApplication(application: any): NormalizedJobApplication {
  const applicantSource = Array.isArray(application?.applicant) ? application.applicant[0] : application?.applicant
  const jobSource = Array.isArray(application?.job) ? application.job[0] : application?.job

  return {
    id: application.id,
    job_id: application.job_id,
    user_id: application.user_id,
    status: application.status ?? "pending",
    cv_url: application.cv_url ?? null,
    cv_id: application.cv_id ?? null,
    cover_letter: application.cover_letter ?? "",
    created_at: application.created_at,
    updated_at: application.updated_at ?? null,
    applicant: {
      id: applicantSource?.id ?? application.user_id ?? null,
      display_name: applicantSource?.display_name ?? applicantSource?.full_name ?? "Applicant",
      email: applicantSource?.email ?? null,
      photo_url: applicantSource?.photo_url ?? null,
      full_name: applicantSource?.full_name ?? null,
      bio: applicantSource?.bio ?? null,
    },
    job: jobSource
      ? {
          id: jobSource.id,
          title: jobSource.title ?? "",
          company: jobSource.company ?? "",
          location: jobSource.location ?? "",
          logo_url: jobSource.logo_url ?? null,
          employment_type: jobSource.employment_type ?? null,
          currency: jobSource.currency ?? null,
          salary_min: jobSource.salary_min ?? null,
          salary_max: jobSource.salary_max ?? null,
          posted_by: jobSource.posted_by ?? null,
        }
      : null,
  }
}
