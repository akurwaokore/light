-- Clubs integrity migration (safe to run in Supabase SQL editor)
-- 1) Remove duplicate memberships
WITH ranked_memberships AS (
  SELECT
    ctid,
    club_id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY club_id, user_id
      ORDER BY ctid
    ) AS rn
  FROM public.club_memberships
)
DELETE FROM public.club_memberships cm
USING ranked_memberships r
WHERE cm.ctid = r.ctid
  AND r.rn > 1;

-- 2) Enforce uniqueness to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS club_memberships_unique_club_user_idx
  ON public.club_memberships (club_id, user_id);

-- 3) Helpful indexes for API performance
CREATE INDEX IF NOT EXISTS clubs_category_idx ON public.clubs (category);
CREATE INDEX IF NOT EXISTS club_memberships_user_id_idx ON public.club_memberships (user_id);
CREATE INDEX IF NOT EXISTS club_memberships_club_id_idx ON public.club_memberships (club_id);

-- 4) Optional roles table for richer club management
CREATE TABLE IF NOT EXISTS public.club_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','moderator','member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

CREATE INDEX IF NOT EXISTS club_member_roles_user_id_idx ON public.club_member_roles (user_id);
CREATE INDEX IF NOT EXISTS club_member_roles_club_id_idx ON public.club_member_roles (club_id);

-- 5) Backfill default role=member for existing memberships where role row is missing
INSERT INTO public.club_member_roles (club_id, user_id, role)
SELECT cm.club_id, cm.user_id, 'member'
FROM public.club_memberships cm
LEFT JOIN public.club_member_roles r
  ON r.club_id = cm.club_id AND r.user_id = cm.user_id
WHERE r.id IS NULL;

-- 6) Ensure club creator has owner role
INSERT INTO public.club_member_roles (club_id, user_id, role)
SELECT c.id, c.created_by, 'owner'
FROM public.clubs c
LEFT JOIN public.club_member_roles r
  ON r.club_id = c.id AND r.user_id = c.created_by
WHERE c.created_by IS NOT NULL
  AND r.id IS NULL;

-- 7) Keep API role queries fresh
ANALYZE public.clubs;
ANALYZE public.club_memberships;
ANALYZE public.club_member_roles;
