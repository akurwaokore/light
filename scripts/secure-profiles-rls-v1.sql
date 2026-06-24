-- ============================================================================
-- secure-profiles-rls-v1.sql
-- Hardens the `profiles` table against cross-account PII (email/phone) leakage.
-- Idempotent: safe to run multiple times.
--
-- Layers of defense:
--   1. RLS: only authenticated users can read profile rows (no anonymous scraping).
--   2. Column privileges: `anon` can never select email/phone.
--   3. A `public_profiles` view exposing ONLY safe display columns, for
--      browse/search/suggestion surfaces.
--   4. A SECURITY DEFINER function `get_profile_contact(uuid)` that returns
--      email/phone ONLY to the owner, an accepted friend, or an admin.
--
-- NOTE: This migration intentionally keeps email/phone readable to the
-- `authenticated` role at the column level so existing admin / job-applications /
-- post-purchase routes keep working. The application code has already been
-- updated to stop returning email/phone to broad audiences. The OPTIONAL final
-- lockdown (revoke email/phone from `authenticated` and route all contact reads
-- through get_profile_contact) is documented in SECURITY_FIXES.md.
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Replace the permissive "anyone (incl. anonymous) can read" policy with an
--    authenticated-only read policy. Display columns remain visible to logged-in
--    members (needed for feed authors, member directory, etc.); column privileges
--    below stop anonymous PII reads.
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 2. Column-level privileges: anonymous role must never read PII.
REVOKE SELECT ON public.profiles FROM anon;
-- Grant anon only the safe display columns (used by public pages / SSR landing).
GRANT SELECT (id, display_name, photo_url, bio, graduation_year, campus, job_title, company)
  ON public.profiles TO anon;

-- 3. Safe public view (no email / phone / membership internals).
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT
  id,
  display_name,
  photo_url,
  bio,
  graduation_year,
  campus,
  job_title,
  company,
  country,
  city,
  linkedin
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 4. Entitlement-checked contact reveal. Runs as definer so it can read PII,
--    but only returns it to the owner, an accepted friend, or an admin.
CREATE OR REPLACE FUNCTION public.get_profile_contact(target uuid)
RETURNS TABLE (id uuid, email text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  is_allowed boolean := false;
BEGIN
  IF caller IS NULL THEN
    RETURN; -- not authenticated -> no rows
  END IF;

  IF caller = target THEN
    is_allowed := true;
  ELSIF EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = caller AND p.is_admin = true
  ) THEN
    is_allowed := true;
  ELSIF EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.user_id = caller AND f.friend_id = target)
        OR (f.user_id = target AND f.friend_id = caller)
      )
  ) THEN
    is_allowed := true;
  END IF;

  IF NOT is_allowed THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.phone FROM public.profiles p WHERE p.id = target;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_contact(uuid) TO authenticated;
