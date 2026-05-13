-- Enable RLS on all tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;

-- Ensure is_admin exists on profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- RLS Policies for Admin Access
-- This function checks if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_admin FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for jobs
DROP POLICY IF EXISTS "Admins can do everything on jobs" ON jobs;
CREATE POLICY "Admins can do everything on jobs" ON jobs
    FOR ALL USING (public.is_admin());

-- Admin policies for marketplace_products
DROP POLICY IF EXISTS "Admins can do everything on marketplace_products" ON marketplace_products;
CREATE POLICY "Admins can do everything on marketplace_products" ON marketplace_products
    FOR ALL USING (public.is_admin());

-- Admin policies for donation_campaigns
DROP POLICY IF EXISTS "Admins can do everything on donation_campaigns" ON donation_campaigns;
CREATE POLICY "Admins can do everything on donation_campaigns" ON donation_campaigns
    FOR ALL USING (public.is_admin());

-- Admin policies for clubs
DROP POLICY IF EXISTS "Admins can do everything on clubs" ON clubs;
CREATE POLICY "Admins can do everything on clubs" ON clubs
    FOR ALL USING (public.is_admin());

-- Admin policies for events
DROP POLICY IF EXISTS "Admins can do everything on events" ON events;
CREATE POLICY "Admins can do everything on events" ON events
    FOR ALL USING (public.is_admin());

-- Admin policies for posts
DROP POLICY IF EXISTS "Admins can do everything on posts" ON posts;
CREATE POLICY "Admins can do everything on posts" ON posts
    FOR ALL USING (public.is_admin());

-- Admin policies for profiles (Members)
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;
CREATE POLICY "Admins can do everything on profiles" ON profiles
    FOR ALL USING (public.is_admin());
