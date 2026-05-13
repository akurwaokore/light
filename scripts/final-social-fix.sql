-- SQL Fix for Social Features: Friendships, Comments, and Post Reactions

-- 1. Ensure foreign keys exist for friendships
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_user_id_fkey') THEN
        ALTER TABLE friendships ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_friend_id_fkey') THEN
        ALTER TABLE friendships ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Ensure RLS is enabled and correct for friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
CREATE POLICY "Users can view their own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
DROP POLICY IF EXISTS "Users can manage their own friendships" ON friendships;
CREATE POLICY "Users can manage their own friendships" ON friendships FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 3. Fix Comments structure if parent_comment_id is missing
-- (Adding it back to allow nested replies in the future)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'parent_comment_id') THEN
        ALTER TABLE comments ADD COLUMN parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Ensure RLS for Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Authors can manage their comments" ON comments;
CREATE POLICY "Authors can manage their comments" ON comments FOR ALL USING (auth.uid() = author_id);

-- 5. Ensure RLS for Post Reactions
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view post reactions" ON post_reactions;
CREATE POLICY "Anyone can view post reactions" ON post_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own reactions" ON post_reactions;
CREATE POLICY "Users can manage their own reactions" ON post_reactions FOR ALL USING (auth.uid() = user_id);

-- 6. Add unique constraint to post_reactions to prevent multiple likes from same user on same post
-- This helps the 'toggle' logic work reliably
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_reactions_post_id_user_id_key') THEN
        ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_post_id_user_id_key UNIQUE (post_id, user_id);
    END IF;
END $$;

-- 7. Ensure updated_at is always set
UPDATE friendships SET updated_at = NOW() WHERE updated_at IS NULL;
