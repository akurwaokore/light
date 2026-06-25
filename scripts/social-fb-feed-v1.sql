-- ============================================================================
-- social-fb-feed-v1.sql
-- Facebook-style community feed: reconcile comments to the code's schema,
-- add comment media + comment reactions, restore saved_posts (bookmarks),
-- and add a per-user friends-list privacy setting.
-- Idempotent: safe to run multiple times. Apply with:
--   node scripts/db-run.mjs scripts/social-fb-feed-v1.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. comments: reconcile parent_id -> parent_comment_id + add media columns.
--    The API (app/api/posts/[id]/comments) selects/inserts parent_comment_id,
--    but the live table had `parent_id` and no media. The old `path` (ltree)
--    design is dropped (ltree not installed; UUIDs aren't valid ltree labels).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='comments' AND column_name='parent_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='comments' AND column_name='parent_comment_id') THEN
    ALTER TABLE public.comments RENAME COLUMN parent_id TO parent_comment_id;
  END IF;
END$$;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS media_urls jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS comments_parent_idx ON public.comments(parent_comment_id);

-- comments had RLS enabled with INSERT/UPDATE/SELECT policies but NO DELETE
-- policy, so "Delete comment" silently affected 0 rows. Add owner/admin delete.
DROP POLICY IF EXISTS comments_owner_delete ON public.comments;
CREATE POLICY comments_owner_delete ON public.comments
  FOR DELETE USING (author_id = auth.uid() OR is_admin());

-- ----------------------------------------------------------------------------
-- 1b. post_reactions / post_shares -> posts FK.
--     These tables had only a user_id FK, so PostgREST could not embed them by
--     post_id (reaction/share counts came back empty). Clean orphaned rows
--     (all current post_reactions point at deleted posts) then add the FKs so
--     `reactions:post_reactions(...)` / `shares:post_shares(...)` embeds work.
-- ----------------------------------------------------------------------------
DELETE FROM public.post_reactions r WHERE NOT EXISTS (SELECT 1 FROM public.posts p WHERE p.id = r.post_id);
DELETE FROM public.post_shares  s WHERE NOT EXISTS (SELECT 1 FROM public.posts p WHERE p.id = s.post_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN unnest(c.conkey) k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype='f' AND c.conrelid='public.post_reactions'::regclass
      AND c.confrelid='public.posts'::regclass AND a.attname='post_id'
  ) THEN
    ALTER TABLE public.post_reactions
      ADD CONSTRAINT post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN unnest(c.conkey) k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype='f' AND c.conrelid='public.post_shares'::regclass
      AND c.confrelid='public.posts'::regclass AND a.attname='post_id'
  ) THEN
    ALTER TABLE public.post_shares
      ADD CONSTRAINT post_shares_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 2. saved_posts (bookmarks). The save/saved API routes already target this
--    table (columns post_id, user_id, saved_at) but it did not exist.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  saved_at  timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS saved_posts_user_idx ON public.saved_posts(user_id);
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_posts_select ON public.saved_posts;
CREATE POLICY saved_posts_select ON public.saved_posts
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS saved_posts_insert ON public.saved_posts;
CREATE POLICY saved_posts_insert ON public.saved_posts
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS saved_posts_delete ON public.saved_posts;
CREATE POLICY saved_posts_delete ON public.saved_posts
  FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. comment_reactions (emoji reactions on comments, Facebook-style).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id    uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like','love','haha','wow','sad','angry')),
  created_at    timestamptz DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS comment_reactions_comment_idx ON public.comment_reactions(comment_id);
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comment_reactions_select ON public.comment_reactions;
CREATE POLICY comment_reactions_select ON public.comment_reactions
  FOR SELECT USING (true);
DROP POLICY IF EXISTS comment_reactions_insert ON public.comment_reactions;
CREATE POLICY comment_reactions_insert ON public.comment_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS comment_reactions_update ON public.comment_reactions;
CREATE POLICY comment_reactions_update ON public.comment_reactions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS comment_reactions_delete ON public.comment_reactions;
CREATE POLICY comment_reactions_delete ON public.comment_reactions
  FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. profiles.friends_visibility — who can see a member's friends list.
--    Default 'friends' (only accepted friends). 'public' = any logged-in user,
--    'private' = only the member themselves.
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS friends_visibility text DEFAULT 'friends';
UPDATE public.profiles SET friends_visibility = 'friends' WHERE friends_visibility IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_friends_visibility_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_friends_visibility_check
      CHECK (friends_visibility IN ('public','friends','private'));
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 5. Realtime: ensure feed-related tables publish live changes.
-- ----------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['posts','comments','post_reactions','post_shares','comment_reactions'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       AND NOT EXISTS (
         SELECT 1 FROM pg_publication_tables
         WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
       ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Realtime publication step skipped: %', SQLERRM;
END$$;
