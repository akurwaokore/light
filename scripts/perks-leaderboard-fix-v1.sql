-- ============================================================================
-- perks-leaderboard-fix-v1.sql
-- Guarantees the Perks API (/api/perks) and Leaderboard API
-- (/api/points/leaderboard) have the tables / view / RLS they depend on.
-- Idempotent — safe to run multiple times.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PERKS table — the public partner-discounts directory.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business    text NOT NULL,
  owner_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  description text,
  discount    text DEFAULT 'Contact partner for offer',
  category    text DEFAULT 'Other',
  logo_url    text,
  is_verified boolean DEFAULT false,
  status      text DEFAULT 'pending',
  created_at  timestamptz DEFAULT now()
);

-- Backfill columns if an older, narrower perks table already exists.
ALTER TABLE public.perks ADD COLUMN IF NOT EXISTS business    text;
ALTER TABLE public.perks ADD COLUMN IF NOT EXISTS owner_id    uuid;
ALTER TABLE public.perks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.perks ADD COLUMN IF NOT EXISTS discount    text;
ALTER TABLE public.perks ADD COLUMN IF NOT EXISTS category    text;
ALTER TABLE public.perks ADD COLUMN IF NOT EXISTS logo_url    text;
ALTER TABLE public.perks ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.perks ADD COLUMN IF NOT EXISTS status      text DEFAULT 'pending';
ALTER TABLE public.perks ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS perks_status_idx ON public.perks (status);

ALTER TABLE public.perks ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous visitors) may read ACTIVE perks; the public Perks
-- marketing page and the dashboard both rely on this.
DROP POLICY IF EXISTS perks_public_read ON public.perks;
CREATE POLICY perks_public_read ON public.perks
  FOR SELECT USING (status = 'active');

-- Authenticated members may submit their own business (lands as 'pending').
DROP POLICY IF EXISTS perks_owner_insert ON public.perks;
CREATE POLICY perks_owner_insert ON public.perks
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can see / edit their own submissions regardless of status.
DROP POLICY IF EXISTS perks_owner_rw ON public.perks;
CREATE POLICY perks_owner_rw ON public.perks
  FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS perks_owner_update ON public.perks;
CREATE POLICY perks_owner_update ON public.perks
  FOR UPDATE USING (auth.uid() = owner_id);

-- Admins manage everything (verify / activate / delete). Guarded so this runs
-- even if the is_admin() helper isn't present yet.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    EXECUTE 'DROP POLICY IF EXISTS perks_admin_all ON public.perks';
    EXECUTE 'CREATE POLICY perks_admin_all ON public.perks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 2. USER_POINTS view — the leaderboard's points source, over profiles.points.
--    (The API now reads profiles directly, but keep the view for the fallback
--     path and any other consumers.)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'points'
  ) THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW public.user_points AS
      SELECT id AS user_id, COALESCE(points, 0) AS total_points
      FROM public.profiles
    $v$;
  END IF;
END$$;

-- Make sure the leaderboard can actually order by points: index it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'points'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS profiles_points_idx ON public.profiles (points DESC NULLS LAST)';
  END IF;
END$$;
