-- ============================================================================
-- careers-v5-01-cvs-multi.sql
-- Allow multiple CVs per user; add primary/label/storage_path; private-CV RLS.
-- Live cvs had UNIQUE(user_id) = cvs_user_id_key. Idempotent.
-- ============================================================================

-- 1. Drop the one-CV-per-user constraint.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cvs_user_id_key') THEN
    ALTER TABLE public.cvs DROP CONSTRAINT cvs_user_id_key;
  END IF;
END$$;

-- 2. New columns.
ALTER TABLE public.cvs ADD COLUMN IF NOT EXISTS is_primary   boolean NOT NULL DEFAULT false;
ALTER TABLE public.cvs ADD COLUMN IF NOT EXISTS label        text;
ALTER TABLE public.cvs ADD COLUMN IF NOT EXISTS storage_path text;

-- 3. Backfill storage_path from legacy public file_url (.../object/public/<bucket>/<path>).
UPDATE public.cvs
SET storage_path = regexp_replace(file_url, '^.*/object/public/[^/]+/', '')
WHERE storage_path IS NULL AND file_url IS NOT NULL AND file_url LIKE '%/object/public/%';

-- 4. Make the newest CV per user the primary one.
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM public.cvs
)
UPDATE public.cvs c SET is_primary = true
FROM ranked r WHERE r.id = c.id AND r.rn = 1
  AND NOT EXISTS (SELECT 1 FROM public.cvs c2 WHERE c2.user_id = c.user_id AND c2.is_primary);

-- 5. At most one primary per user.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cvs_one_primary ON public.cvs(user_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs(user_id);

-- 6. RLS: owner full; admin; poster of a job this CV was used to apply to may SELECT.
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cvs_owner_all ON public.cvs;
CREATE POLICY cvs_owner_all ON public.cvs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS cvs_admin_read ON public.cvs;
CREATE POLICY cvs_admin_read ON public.cvs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS cvs_poster_read ON public.cvs;
CREATE POLICY cvs_poster_read ON public.cvs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.job_applications ja JOIN public.jobs j ON j.id = ja.job_id
    WHERE ja.cv_id = cvs.id AND j.posted_by = auth.uid()
  ));
