-- dashboard-fixes-v1.sql
-- Idempotent fixes for: feed posting (RLS), notifications delivery (RLS),
-- event registration (RLS), events schema drift, clubs creation, jobs
-- auto-approve, perks, and the annual-membership grant + paid contributions.
-- Safe to run multiple times.

-- ============================================================
-- 1. POSTS: add the missing SELECT policy. RLS was enabled with only
--    INSERT/UPDATE policies, so every read (and INSERT ... RETURNING)
--    returned nothing -> the feed was permanently empty / "can't post".
-- ============================================================
DROP POLICY IF EXISTS posts_select ON posts;
CREATE POLICY posts_select ON posts FOR SELECT USING (
  author_id = auth.uid()
  OR is_admin()
  OR (status IS DISTINCT FROM 'removed' AND visibility = 'public')
  OR (
    visibility = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND ((f.user_id = auth.uid() AND f.friend_id = posts.author_id)
          OR (f.friend_id = auth.uid() AND f.user_id = posts.author_id))
    )
  )
);

-- Allow authors to delete their own posts (and admins any).
DROP POLICY IF EXISTS posts_owner_delete ON posts;
CREATE POLICY posts_owner_delete ON posts FOR DELETE USING (
  author_id = auth.uid() OR is_admin()
);

-- ============================================================
-- 2. NOTIFICATIONS: users could not READ their own notifications (no SELECT
--    policy) and could not create notifications for OTHER users (INSERT
--    WITH CHECK pinned user_id = auth.uid()). That silently broke friend
--    requests / accepts / club joins / event + job notifications.
-- ============================================================
DROP POLICY IF EXISTS notifications_owner_select ON notifications;
CREATE POLICY notifications_owner_select ON notifications FOR SELECT USING (
  user_id = auth.uid() OR is_admin()
);

-- Any authenticated user may create a notification (typically for another
-- user as a side effect of an action). Recipients still only read their own.
DROP POLICY IF EXISTS notifications_owner_insert ON notifications;
DROP POLICY IF EXISTS notifications_insert_any ON notifications;
CREATE POLICY notifications_insert_any ON notifications FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- ============================================================
-- 3. EVENT_REGISTRATIONS: no SELECT policy meant register .select() returned
--    nothing (500) and users could not see their own registrations.
--    (events.organizer_id is added first so the policy can reference it.)
-- ============================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id uuid;

DROP POLICY IF EXISTS event_registrations_select ON event_registrations;
CREATE POLICY event_registrations_select ON event_registrations FOR SELECT USING (
  user_id = auth.uid()
  OR is_admin()
  OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_registrations.event_id AND e.organizer_id = auth.uid())
);

DROP POLICY IF EXISTS event_registrations_owner_delete ON event_registrations;
CREATE POLICY event_registrations_owner_delete ON event_registrations FOR DELETE USING (
  user_id = auth.uid() OR is_admin()
);

-- ============================================================
-- 4. EVENTS: add the two columns the app needs (owner + approval status).
--    The live events table is the canonical schema (start_at/end_at/
--    event_type/meeting_url/capacity/registrations_count/ticket_price);
--    the API is being rewritten to that schema in this change.
-- ============================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id uuid;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'events_organizer_id_fkey' AND table_name = 'events'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_organizer_id_fkey
      FOREIGN KEY (organizer_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Existing events have no owner recorded; make them visible + approved.
UPDATE events SET status = 'approved' WHERE status IS NULL OR status = '';

-- Owners (and admins) may insert/update/delete their events; everyone reads.
DROP POLICY IF EXISTS events_owner_insert ON events;
CREATE POLICY events_owner_insert ON events FOR INSERT WITH CHECK (
  organizer_id = auth.uid() OR is_admin()
);
DROP POLICY IF EXISTS events_owner_update ON events;
CREATE POLICY events_owner_update ON events FOR UPDATE USING (
  organizer_id = auth.uid() OR is_admin()
);
DROP POLICY IF EXISTS events_owner_delete ON events;
CREATE POLICY events_owner_delete ON events FOR DELETE USING (
  organizer_id = auth.uid() OR is_admin()
);

-- ============================================================
-- 5. CLUBS: the create route inserts created_by + icon, neither of which
--    existed; slug is NOT NULL with no default. Add the columns + a slug
--    default so club creation works.
-- ============================================================
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE clubs ALTER COLUMN slug SET DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clubs_created_by_fkey' AND table_name = 'clubs'
  ) THEN
    ALTER TABLE clubs
      ADD CONSTRAINT clubs_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Authenticated users may create clubs; owners/admins may update.
DROP POLICY IF EXISTS clubs_insert ON clubs;
CREATE POLICY clubs_insert ON clubs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS clubs_update ON clubs;
CREATE POLICY clubs_update ON clubs FOR UPDATE USING (created_by = auth.uid() OR is_admin());

-- ============================================================
-- 6. SYSTEM SETTINGS: turn on auto-approval for jobs and posts.
-- ============================================================
INSERT INTO system_settings (key, value)
VALUES ('jobs_auto_approve', 'true'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = 'true'::jsonb, updated_at = now();

INSERT INTO system_settings (key, value)
VALUES ('posts_auto_approve', 'true'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = 'true'::jsonb, updated_at = now();

-- Make the existing pending jobs live now that auto-approve is on.
UPDATE jobs SET status = 'active', updated_at = now() WHERE status = 'pending_approval';

-- ============================================================
-- 7. MEMBERSHIP GRANT: give every current user the annual membership
--    (gold, expiring 1 year out) and record their KES 1000 contribution
--    as an already-paid transaction (idempotent via reference_id).
-- ============================================================
UPDATE profiles
SET membership_tier = 'gold',
    membership_expiry = now() + interval '1 year',
    updated_at = now();

INSERT INTO transactions (
  user_id, user_name, type, amount, currency, payment_method,
  status, description, reference_id, completed_at, created_at
)
SELECT
  p.id,
  COALESCE(NULLIF(p.full_name, ''), NULLIF(p.display_name, ''), p.email, 'Member'),
  'membership',
  1000,
  'KES',
  'mpesa',
  'completed',
  'Annual membership (KES 1,000) — paid',
  'annual-membership-grant-2026:' || p.id::text,
  now(),
  now()
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.reference_id = 'annual-membership-grant-2026:' || p.id::text
);

-- ============================================================
-- 8. PERKS: ensure authenticated users can read active perks (already
--    permissive) — no change needed; the page is being switched from
--    mock data to this table in this change.
-- ============================================================
