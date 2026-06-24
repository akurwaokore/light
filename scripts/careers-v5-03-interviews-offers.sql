-- ============================================================================
-- careers-v5-03-interviews-offers.sql
-- Interview scheduling + offers, scoped to an application's poster & applicant.
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.interviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  scheduled_at   timestamptz NOT NULL,
  duration_min   integer DEFAULT 30,
  mode           text NOT NULL DEFAULT 'video' CHECK (mode IN ('in_person','video','phone')),
  location       text,
  meeting_link   text,
  notes          text,
  status         text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  created_by     uuid NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  salary_amount  numeric,
  currency       text DEFAULT 'KES',
  terms          text,
  start_date     date,
  expires_at     timestamptz,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','withdrawn')),
  created_by     uuid NOT NULL,
  responded_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_app ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_app ON public.offers(application_id);

-- Helper: is the caller a party (applicant or poster) to an application?
CREATE OR REPLACE FUNCTION public.is_application_party(p_app uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM job_applications ja JOIN jobs j ON j.id = ja.job_id
    WHERE ja.id = p_app
      AND (ja.user_id = auth.uid() OR j.posted_by = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_application_party(uuid) TO authenticated;

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interviews_party ON public.interviews;
CREATE POLICY interviews_party ON public.interviews FOR ALL TO authenticated
  USING (public.is_application_party(application_id))
  WITH CHECK (public.is_application_party(application_id));

DROP POLICY IF EXISTS offers_party ON public.offers;
CREATE POLICY offers_party ON public.offers FOR ALL TO authenticated
  USING (public.is_application_party(application_id))
  WITH CHECK (public.is_application_party(application_id));
