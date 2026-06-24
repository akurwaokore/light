-- ============================================================================
-- careers-v5-05-saved-jobs-alerts.sql
-- Saved jobs + job alerts (owner-only). Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id     uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS public.job_alerts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  keywords          text[] DEFAULT '{}',
  categories        text[] DEFAULT '{}',
  employment_types  text[] DEFAULT '{}',
  experience_levels text[] DEFAULT '{}',
  is_remote         boolean,
  salary_min        integer,
  location          text,
  frequency         text NOT NULL DEFAULT 'instant' CHECK (frequency IN ('instant','daily','weekly')),
  is_active         boolean NOT NULL DEFAULT true,
  last_run_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user ON public.job_alerts(user_id);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_jobs_owner ON public.saved_jobs;
CREATE POLICY saved_jobs_owner ON public.saved_jobs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS job_alerts_owner ON public.job_alerts;
CREATE POLICY job_alerts_owner ON public.job_alerts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
