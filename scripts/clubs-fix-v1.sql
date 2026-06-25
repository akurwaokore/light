-- ============================================================================
-- clubs-fix-v1.sql
-- Make clubs real: remove orphaned memberships + dummy member counts, enforce
-- integrity (FKs + unique membership), keep clubs.member_count in sync with a
-- trigger, and allow owners/admins to delete clubs.
-- Idempotent. Apply with:
--   node scripts/db-run.mjs scripts/clubs-fix-v1.sql
-- ============================================================================

-- 1. Remove memberships that point at clubs that no longer exist (the live DB
--    had 10 such orphans, which is why every real club showed 0 members while
--    the seeded member_count column still showed dummy values like 405).
DELETE FROM public.club_memberships m
  WHERE NOT EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = m.club_id);

-- 2. Integrity: FK club_memberships.club_id -> clubs (cascade) and user_id ->
--    profiles, plus one-membership-per-user-per-club. Guarded so re-runs are safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN unnest(c.conkey) k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype='f' AND c.conrelid='public.club_memberships'::regclass
      AND c.confrelid='public.clubs'::regclass AND a.attname='club_id'
  ) THEN
    ALTER TABLE public.club_memberships
      ADD CONSTRAINT club_memberships_club_id_fkey
      FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN unnest(c.conkey) k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype='f' AND c.conrelid='public.club_memberships'::regclass
      AND c.confrelid='public.profiles'::regclass AND a.attname='user_id'
  ) THEN
    ALTER TABLE public.club_memberships
      ADD CONSTRAINT club_memberships_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS club_memberships_club_user_uniq
  ON public.club_memberships(club_id, user_id);

-- 3. Keep clubs.member_count synced with real membership rows.
CREATE OR REPLACE FUNCTION public.sync_club_member_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.club_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_club_member_count ON public.club_memberships;
CREATE TRIGGER trg_sync_club_member_count
  AFTER INSERT OR DELETE ON public.club_memberships
  FOR EACH ROW EXECUTE FUNCTION public.sync_club_member_count();

-- 4. Reset the dummy counts to the real values (0 for all current clubs).
UPDATE public.clubs c
  SET member_count = (SELECT count(*) FROM public.club_memberships m WHERE m.club_id = c.id);

-- 5. clubs had RLS with insert/select/update but NO delete policy → owners/admins
--    could not delete a club. Add it.
DROP POLICY IF EXISTS clubs_owner_delete ON public.clubs;
CREATE POLICY clubs_owner_delete ON public.clubs
  FOR DELETE USING (created_by = auth.uid() OR is_admin());
