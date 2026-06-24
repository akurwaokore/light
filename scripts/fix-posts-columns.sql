-- Fix: add columns the app expects on `posts` but that older migrations
-- (final-ultimate-fix.sql / ultimate-fix-all.sql) never created. Symptom:
-- "Could not find the 'image_url' column of 'posts' in the schema cache"
-- (PostgREST PGRST204) when creating a post.
--
-- Safe to run repeatedly: every statement is IF NOT EXISTS / idempotent.

ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url    text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url    text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls   jsonb DEFAULT '[]'::jsonb;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility   text  DEFAULT 'public';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status       text  DEFAULT 'active';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at   timestamptz DEFAULT now();
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES posts(id) ON DELETE SET NULL;

-- Backfill any rows created before the columns existed.
UPDATE posts SET visibility = 'public' WHERE visibility IS NULL;
UPDATE posts SET status     = 'active' WHERE status IS NULL;
UPDATE posts SET media_urls = '[]'::jsonb WHERE media_urls IS NULL;

-- PostgREST caches the schema; tell it to reload so the new columns are
-- visible immediately without restarting the project.
NOTIFY pgrst, 'reload schema';
