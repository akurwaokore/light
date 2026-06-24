-- ============================================================================
-- careers-v5-02-pipeline.sql
-- Richer application pipeline status set. Base columns (user_id, cv_id,
-- reviewed_by/at, rejection_reason, updated_at) were added in reconcile-01.
-- Idempotent.
-- ============================================================================

-- Normalize any legacy statuses to the new vocabulary before constraining.
UPDATE public.job_applications SET status = 'pending'  WHERE status = 'submitted';
UPDATE public.job_applications SET status = 'interview_scheduled' WHERE status = 'interviewing';
UPDATE public.job_applications SET status = 'offer_extended'      WHERE status = 'offered';

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='job_applications_status_check') THEN
    ALTER TABLE public.job_applications DROP CONSTRAINT job_applications_status_check;
  END IF;
  ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_status_check
    CHECK (status IN (
      'pending','reviewed','shortlisted','interview_scheduled','interviewed',
      'offer_extended','offer_accepted','offer_declined','hired','rejected','withdrawn'
    ));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipped job_applications status check: %', SQLERRM;
END$$;

CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- RLS: applicant sees own; poster sees applications to their jobs; admin all.
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ja_select ON public.job_applications;
CREATE POLICY ja_select ON public.job_applications FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_applications.job_id AND j.posted_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS ja_insert ON public.job_applications;
CREATE POLICY ja_insert ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS ja_update ON public.job_applications;
CREATE POLICY ja_update ON public.job_applications FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_applications.job_id AND j.posted_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
