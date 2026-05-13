-- ==============================================================================
-- LIGHTALUM SOCIAL & POINTS SYSTEM CONSOLIDATED FIX
-- Run this script in your Supabase SQL Editor to ensure all features work.
-- ==============================================================================

-- 1. NOTIFICATIONS TYPE CONSTRAINT FIX
-- This allows all social notification types to be inserted correctly.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'product_approved', 'product_rejected', 'product_sold', 'product_purchased',
    'service_approved', 'service_rejected', 'service_purchased',
    'property_approved', 'property_rejected', 'property_sold',
    'payout_completed', 'payout_failed',
    'request_response', 'request_resolved',
    'event_reminder', 'event_cancelled', 'event_updated',
    'new_submission', 'admin_action_required',
    'meet_invitation', 'meet_reminder', 'meet_cancelled',
    'post_like', 'post_comment', 'comment_reply', 'friend_request', 'friend_accepted', 'post_share',
    'general'
));

-- 2. ENSURE TABLES EXIST AND RLS IS ENABLED
CREATE TABLE IF NOT EXISTS posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    video_url text,
    media_urls jsonb DEFAULT '[]',
    visibility text DEFAULT 'public',
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    shared_post_id uuid REFERENCES posts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS post_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type text DEFAULT 'like',
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    share_text text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. POSTS POLICIES
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);

-- 4. REACTIONS POLICIES
DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
CREATE POLICY "Anyone can view reactions" ON post_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can react to posts" ON post_reactions;
CREATE POLICY "Users can react to posts" ON post_reactions FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 5. COMMENTS POLICIES
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can post comments" ON comments;
CREATE POLICY "Users can post comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);

-- 6. SHARES POLICIES
DROP POLICY IF EXISTS "Anyone can view shares" ON post_shares;
CREATE POLICY "Anyone can view shares" ON post_shares FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create shares" ON post_shares;
CREATE POLICY "Users can create shares" ON post_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- 8. RETROACTIVELY AWARD REGISTRATION POINTS
-- Awards 10 points to users who haven't received them yet.
INSERT INTO public.points_transactions (user_id, points, type, reason, metadata)
SELECT id, 10, 'earn', 'Registration Bonus', '{"source": "retroactive_fix"}'::jsonb
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.points_transactions pt 
  WHERE pt.user_id = p.id AND pt.reason = 'Registration Bonus'
);

-- Update profile point totals
UPDATE public.profiles p
SET 
  points = COALESCE((SELECT SUM(points) FROM public.points_transactions pt WHERE pt.user_id = p.id), 0),
  points_updated_at = NOW()
WHERE id IN (
  SELECT user_id FROM public.points_transactions WHERE reason = 'Registration Bonus'
);

-- 9. ENSURE HANDLE_NEW_USER TRIGGER AWARDS POINTS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, status, membership_tier, points)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'active',
    'free',
    10
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.full_name,
    updated_at = now();

  -- Record the transaction
  INSERT INTO public.points_transactions (user_id, points, type, reason, metadata)
  VALUES (new.id, 10, 'earn', 'Registration Bonus', '{"source": "trigger"}'::jsonb);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ENSURE POST STATUS IS ACTIVE BY DEFAULT
ALTER TABLE posts ALTER COLUMN status SET DEFAULT 'active';
UPDATE posts SET status = 'active' WHERE status IS NULL OR status = 'pending';
