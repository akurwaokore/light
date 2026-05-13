-- Fix relationships and ensure proper foreign keys for friendships
-- This ensures that the requester and recipient can be correctly joined with the profiles table

-- First, ensure the friendships table has the correct foreign key constraints if they are missing or named differently
DO $$ 
BEGIN
    -- Check if friendships_user_id_fkey exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_user_id_fkey') THEN
        ALTER TABLE friendships 
        ADD CONSTRAINT friendships_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Check if friendships_friend_id_fkey exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_friend_id_fkey') THEN
        ALTER TABLE friendships 
        ADD CONSTRAINT friendships_friend_id_fkey 
        FOREIGN KEY (friend_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update any null statuses to 'pending' just in case
UPDATE friendships SET status = 'pending' WHERE status IS NULL;

-- Ensure all 'accepted' friendships have an accepted_at date if missing
UPDATE friendships 
SET accepted_at = created_at 
WHERE status = 'accepted' AND accepted_at IS NULL;

-- Enable RLS on friendships if not already enabled
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure users can see their own friendships
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
CREATE POLICY "Users can view their own friendships" ON friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can insert their own friendships" ON friendships;
CREATE POLICY "Users can insert their own friendships" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own friendships" ON friendships;
CREATE POLICY "Users can update their own friendships" ON friendships
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete their own friendships" ON friendships;
CREATE POLICY "Users can delete their own friendships" ON friendships
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
