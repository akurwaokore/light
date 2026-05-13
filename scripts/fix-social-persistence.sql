-- FIX SOCIAL PERSISTENCE AND INTERACTIONS
-- Run this in your Supabase SQL editor

-- 1. Ensure RLS is enabled on all social tables
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 2. Reaction Policies Fix
DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
CREATE POLICY "Anyone can view reactions" ON post_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can react to posts" ON post_reactions;
CREATE POLICY "Users can react to posts" ON post_reactions FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 3. Comment Policies Fix
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can post comments" ON comments;
CREATE POLICY "Users can post comments" ON comments FOR INSERT 
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE 
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE 
USING (auth.uid() = author_id);

-- 4. Share Policies Fix
DROP POLICY IF EXISTS "Anyone can view shares" ON post_shares;
CREATE POLICY "Anyone can view shares" ON post_shares FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create shares" ON post_shares;
CREATE POLICY "Users can create shares" ON post_shares FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Posts Policy Fix (ensure sharing creates a post correctly)
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- 6. Add updated_at if not exists and trigger
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

CREATE OR REPLACE FUNCTION update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE PROCEDURE update_social_updated_at();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE PROCEDURE update_social_updated_at();
