-- Career Hub reliability hardening
-- Idempotent migration for jobs applications + notifications compatibility

BEGIN;

-- Ensure job_applications table exists with required columns
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS cv_url TEXT;

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS cover_letter TEXT;

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);

-- Keep applicant_id populated for legacy/new code paths
UPDATE public.job_applications
SET applicant_id = user_id
WHERE applicant_id IS NULL AND user_id IS NOT NULL;

-- Enable and normalize RLS policies
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants can view own applications" ON public.job_applications;
CREATE POLICY "Applicants can view own applications"
ON public.job_applications
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Posters can view applications for their jobs" ON public.job_applications;
CREATE POLICY "Posters can view applications for their jobs"
ON public.job_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = job_applications.job_id
      AND jobs.posted_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can apply for jobs" ON public.job_applications;
CREATE POLICY "Users can apply for jobs"
ON public.job_applications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR auth.uid() = applicant_id
);

DROP POLICY IF EXISTS "Posters can update applications for their jobs" ON public.job_applications;
CREATE POLICY "Posters can update applications for their jobs"
ON public.job_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = job_applications.job_id
      AND jobs.posted_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = job_applications.job_id
      AND jobs.posted_by = auth.uid()
  )
);

-- Notifications compatibility: make sure common fields exist
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Backfill message from content when needed
UPDATE public.notifications
SET message = content
WHERE (message IS NULL OR message = '')
  AND content IS NOT NULL;

COMMIT;
