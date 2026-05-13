-- Update the social feed system to support visibility and connection requests

-- 1. Add visibility column to posts if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'visibility') THEN
        ALTER TABLE public.posts ADD COLUMN visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private'));
    END IF;
END $$;

-- 2. Update existing posts to be public if visibility was just added
UPDATE public.posts SET visibility = 'public' WHERE visibility IS NULL;

-- 3. Ensure anyone can view public posts via RLS
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" ON public.posts 
FOR SELECT USING (
    visibility = 'public' 
    OR auth.uid() = author_id 
    OR (
        visibility = 'friends' AND EXISTS (
            SELECT 1 FROM public.friendships 
            WHERE status = 'accepted' AND (
                (user_id = auth.uid() AND friend_id = posts.author_id) OR 
                (friend_id = auth.uid() AND user_id = posts.author_id)
            )
        )
    )
);

-- 4. Ensure RLS policies for friendships are in place
-- (Assuming friendships table already exists based on earlier API checks)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships" ON public.friendships
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friendship requests" ON public.friendships;
CREATE POLICY "Users can create friendship requests" ON public.friendships
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own friendships" ON public.friendships;
CREATE POLICY "Users can update their own friendships" ON public.friendships
FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 5. Ensure notifications are correctly handled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true); -- Usually restricted to service role or authenticated in our flow

-- 6. Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS idx_friendships_status_composite ON public.friendships(user_id, friend_id, status);

-- 6.5 Fix Profile Status Check Constraint
-- This address the error "new row for relation 'profiles' violates check constraint 'profiles_status_check'"
DO $$
BEGIN
    -- Drop the existing constraint
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
    
    -- Re-add it with a comprehensive list of allowed statuses
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('active', 'inactive', 'suspended', 'studying', 'working', 'retired', 'other', 'pending', 'rejected', 'approved'));

    -- Ensure all existing profiles have a valid status
    UPDATE public.profiles SET status = 'active' WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'suspended', 'studying', 'working', 'retired', 'other', 'pending', 'rejected', 'approved');
END $$;

-- 7. Fix marketplace products table schema mismatch
-- Some scripts use 'images' (text array) and some use 'image_urls' (text array)
-- The API is currently expecting 'image_urls'
DO $$
BEGIN
    -- If 'images' exists but 'image_urls' doesn't, rename or add 'image_urls'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'images') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_urls') THEN
        ALTER TABLE public.products RENAME COLUMN images TO image_urls;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_urls') THEN
        ALTER TABLE public.products ADD COLUMN image_urls TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Also ensure 'currency' column exists as it's used in the API
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'currency') THEN
        ALTER TABLE public.products ADD COLUMN currency VARCHAR(10) DEFAULT 'KES';
    END IF;
END $$;
