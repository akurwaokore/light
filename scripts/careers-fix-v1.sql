-- ============================================================================
-- careers-fix-v1.sql
-- Reconcile the Career Hub schema with the code so post-job / apply / CV upload
-- / "my applications" / withdraw all work end to end.
-- Idempotent. Apply with:
--   node scripts/db-run.mjs scripts/careers-fix-v1.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. jobs.currency — the UI + normalizer + /api/jobs/my-applications select it,
--    but the column did not exist (so the my-applications query errored out and
--    applied jobs were invisible). Default KES; backfill existing rows.
-- ----------------------------------------------------------------------------
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS currency text DEFAULT 'KES';
UPDATE public.jobs SET currency = 'KES' WHERE currency IS NULL;

-- Keep the legacy NOT NULL job_type in sync with employment_type where it drifted.
UPDATE public.jobs SET job_type = employment_type
  WHERE employment_type IS NOT NULL AND (job_type IS NULL OR job_type <> employment_type);

-- ----------------------------------------------------------------------------
-- 2. job_applications — add withdrawn_at (the withdraw route writes it) and fix
--    the status DEFAULT, which was 'submitted' — a value the status CHECK
--    constraint rejects, so any insert that omitted status failed.
-- ----------------------------------------------------------------------------
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;
ALTER TABLE public.job_applications ALTER COLUMN status SET DEFAULT 'pending';

-- ----------------------------------------------------------------------------
-- 3. cvs.user_name / user_email were NOT NULL with no default, so a CV upload
--    missing those fields failed. Give them a safe default (the route now also
--    falls back to the uploader's profile name/email).
-- ----------------------------------------------------------------------------
ALTER TABLE public.cvs ALTER COLUMN user_name SET DEFAULT '';
ALTER TABLE public.cvs ALTER COLUMN user_email SET DEFAULT '';
UPDATE public.cvs SET user_name = '' WHERE user_name IS NULL;
UPDATE public.cvs SET user_email = '' WHERE user_email IS NULL;

-- ----------------------------------------------------------------------------
-- 4. jobs RLS — the table had RLS enabled with ONLY a SELECT policy, so members
--    could not post/edit/remove jobs (insert was denied by RLS; only the admin
--    service-role path worked). Add owner insert/update/delete.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS jobs_owner_insert ON public.jobs;
CREATE POLICY jobs_owner_insert ON public.jobs
  FOR INSERT WITH CHECK (posted_by = auth.uid());
DROP POLICY IF EXISTS jobs_owner_update ON public.jobs;
CREATE POLICY jobs_owner_update ON public.jobs
  FOR UPDATE USING (posted_by = auth.uid() OR is_admin())
  WITH CHECK (posted_by = auth.uid() OR is_admin());
DROP POLICY IF EXISTS jobs_owner_delete ON public.jobs;
CREATE POLICY jobs_owner_delete ON public.jobs
  FOR DELETE USING (posted_by = auth.uid() OR is_admin());

-- ----------------------------------------------------------------------------
-- 5. Lock down CV visibility. The "Authenticated users can view all active CVs"
--    policy exposed every member's CV row metadata to any logged-in user. Drop
--    it; the owner (cvs_owner_all / "Users can view their own CV"), the poster
--    of a job the CV was used to apply to (cvs_poster_read), and admins
--    (cvs_admin_read) retain access. File bytes are already signed-URL gated.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view all active CVs" ON public.cvs;
