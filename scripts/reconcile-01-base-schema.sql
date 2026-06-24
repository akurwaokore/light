-- ============================================================================
-- reconcile-01-base-schema.sql
-- Aligns the LIVE database with the columns the application code already writes.
-- Introspection (2026-06) found the live tables lag the code, so notifications,
-- job posting, and job applications were failing on unknown/missing columns.
-- Idempotent: ADD COLUMN IF NOT EXISTS, guarded DO blocks. Safe to re-run.
-- ============================================================================

-- ---------- notifications ----------
-- Live had only (id, user_id, title, body, type, read, created_at); code inserts
-- message/action_url/link/metadata across many routes.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message    text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_url text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link       text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata   jsonb DEFAULT '{}'::jsonb;
-- Keep legacy `body` populated from `message` (and vice-versa) so old + new
-- readers both work.
CREATE OR REPLACE FUNCTION public.sync_notification_body()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.message IS NULL AND NEW.body IS NOT NULL THEN NEW.message := NEW.body; END IF;
  IF NEW.body IS NULL AND NEW.message IS NOT NULL THEN NEW.body := NEW.message; END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_sync_notification_body ON public.notifications;
CREATE TRIGGER trg_sync_notification_body
  BEFORE INSERT OR UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_notification_body();

-- ---------- jobs ----------
-- Live had 12 cols; code inserts the full posting shape.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status              text DEFAULT 'pending_approval';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS skills              text[] DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS requirements        text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS responsibilities    text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS employment_type     text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS experience_level    text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_min          integer;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_max          integer;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS category_id         text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS logo_url            text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS application_deadline timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_remote           boolean DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS views               integer DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at          timestamptz DEFAULT now();
-- Mirror the legacy `remote` column into `is_remote` and keep both in sync.
UPDATE public.jobs SET is_remote = remote WHERE is_remote IS DISTINCT FROM remote;

-- ---------- job_applications ----------
-- Live: (id, job_id, applicant_id NOT NULL, status, cover_letter, created_at).
-- All code uses user_id / cv_url / cv_id and the richer pipeline.
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS user_id          uuid;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS cv_url           text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS cv_id            uuid;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS reviewed_by      uuid;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS reviewed_at      timestamptz;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS notes            text;

-- applicant_id was NOT NULL but code never sets it; make it nullable and keep
-- it in sync with user_id (both directions) so legacy + new readers work.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='job_applications'
               AND column_name='applicant_id' AND is_nullable='NO') THEN
    ALTER TABLE public.job_applications ALTER COLUMN applicant_id DROP NOT NULL;
  END IF;
END$$;

UPDATE public.job_applications SET user_id = applicant_id WHERE user_id IS NULL AND applicant_id IS NOT NULL;
UPDATE public.job_applications SET applicant_id = user_id WHERE applicant_id IS NULL AND user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_application_actor()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.applicant_id IS NOT NULL THEN NEW.user_id := NEW.applicant_id; END IF;
  IF NEW.applicant_id IS NULL AND NEW.user_id IS NOT NULL THEN NEW.applicant_id := NEW.user_id; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_sync_application_actor ON public.job_applications;
CREATE TRIGGER trg_sync_application_actor
  BEFORE INSERT OR UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_application_actor();

-- Ensure a FK job_applications.job_id -> jobs.id exists so PostgREST embeds
-- (e.g. `applications:job_applications(count)` in my-listings) resolve. Only add
-- if NO foreign key already constrains job_id (avoid double-FK breakage if an
-- old FK points at the legacy job_listings table).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid = 'public.job_applications'::regclass
      AND c.contype = 'f'
      AND (SELECT attname FROM pg_attribute WHERE attrelid = c.conrelid AND attnum = c.conkey[1]) = 'job_id'
  ) THEN
    ALTER TABLE public.job_applications
      ADD CONSTRAINT job_applications_job_id_fkey
      FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipped job_applications->jobs FK: %', SQLERRM;
END$$;

-- Optional FK for cv_id (nullable) — only if no FK already on cv_id.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid = 'public.job_applications'::regclass
      AND c.contype = 'f'
      AND (SELECT attname FROM pg_attribute WHERE attrelid = c.conrelid AND attnum = c.conkey[1]) = 'cv_id'
  ) THEN
    ALTER TABLE public.job_applications
      ADD CONSTRAINT job_applications_cv_id_fkey
      FOREIGN KEY (cv_id) REFERENCES public.cvs(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipped job_applications->cvs FK: %', SQLERRM;
END$$;

CREATE INDEX IF NOT EXISTS idx_job_applications_user ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
