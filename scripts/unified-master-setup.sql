-- ==========================================
-- Light Alumni Platform - Master SQL Script (Unified)
-- ==========================================

-- 1. Profiles and Core Tables
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  full_name TEXT,
  email TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  graduation_year INTEGER,
  campus TEXT,
  job_title TEXT,
  company TEXT,
  bio TEXT,
  location TEXT,
  country TEXT,
  city TEXT,
  linkedin TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'silver', 'gold', 'platinum')),
  membership_expiry TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure 'role' column exists in case profiles table already existed without it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));
    END IF;
END $$;

-- 2. System Settings & Pesapal
-- ==========================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    siteName TEXT DEFAULT 'Light Alumni Connect',
    siteDescription TEXT DEFAULT 'Official alumni platform for Light Academy',
    adminEmail TEXT DEFAULT 'admin@lightalumni.com',
    supportEmail TEXT DEFAULT 'support@lightalumni.com',
    defaultCurrency TEXT DEFAULT 'KES',
    enableRegistration BOOLEAN DEFAULT true,
    requireEmailVerification BOOLEAN DEFAULT false,
    enableMarketplace BOOLEAN DEFAULT true,
    marketplaceCommission TEXT DEFAULT '5',
    enableDonations BOOLEAN DEFAULT true,
    enableEvents BOOLEAN DEFAULT true,
    maxEventAttendees TEXT DEFAULT '500',
    enableJobBoard BOOLEAN DEFAULT true,
    emailNotifications BOOLEAN DEFAULT true,
    pushNotifications BOOLEAN DEFAULT false,
    maintenanceMode BOOLEAN DEFAULT false,
    analyticsEnabled BOOLEAN DEFAULT true,
    pesapalConsumerKey TEXT DEFAULT '',
    pesapalConsumerSecret TEXT DEFAULT '',
    pesapalEnvironment TEXT DEFAULT 'sandbox',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT one_row_only CHECK (id = 1)
);

INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3. Marketplace & E-commerce
-- ==========================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  product_type VARCHAR(20) DEFAULT 'product' CHECK (product_type IN ('product', 'service')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clean up duplicates and ensure UNIQUE constraint on name for product_categories
DO $$ 
BEGIN 
    -- Clean up duplicates if they exist
    DELETE FROM product_categories a USING product_categories b 
    WHERE a.id > b.id AND a.name = b.name;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_name_key') THEN
        ALTER TABLE product_categories ADD CONSTRAINT product_categories_name_key UNIQUE (name);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id),
  image_urls TEXT[],
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'sold')),
  product_type VARCHAR(20) DEFAULT 'product' CHECK (product_type IN ('product', 'service')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO product_categories (name, description, product_type) VALUES
  ('Electronics', 'Computers, phones, gadgets, and electronic devices', 'product'),
  ('Fashion', 'Clothing, accessories, and fashion items', 'product'),
  ('Vehicles', 'Cars, motorcycles, and other vehicles', 'product'),
  ('Services', 'Professional services offered by alumni', 'service'),
  ('Consulting', 'Business and professional consulting services', 'service')
ON CONFLICT (name) DO NOTHING;

-- 4. Careers & Job Board
-- ==========================================
CREATE TABLE IF NOT EXISTS job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clean up duplicates and ensure UNIQUE constraint on name for job_categories
DO $$ 
BEGIN 
    -- Clean up duplicates if they exist
    DELETE FROM job_categories a USING job_categories b 
    WHERE a.id > b.id AND a.name = b.name;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_categories_name_key') THEN
        ALTER TABLE job_categories ADD CONSTRAINT job_categories_name_key UNIQUE (name);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_range TEXT,
  experience_level TEXT,
  requirements TEXT[],
  application_link TEXT,
  application_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'active', 'closed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure missing columns exist in case job_listings table already existed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_listings' AND column_name='salary_range') THEN
        ALTER TABLE job_listings ADD COLUMN salary_range TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_listings' AND column_name='experience_level') THEN
        ALTER TABLE job_listings ADD COLUMN experience_level TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_listings' AND column_name='requirements') THEN
        ALTER TABLE job_listings ADD COLUMN requirements TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_listings' AND column_name='application_link') THEN
        ALTER TABLE job_listings ADD COLUMN application_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_listings' AND column_name='application_email') THEN
        ALTER TABLE job_listings ADD COLUMN application_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_listings' AND column_name='updated_at') THEN
        ALTER TABLE job_listings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

INSERT INTO job_categories (name) VALUES ('Technology'), ('Healthcare'), ('Education'), ('Finance') ON CONFLICT (name) DO NOTHING;

-- 5. Events System
-- ==========================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME,
  location VARCHAR(255),
  is_virtual BOOLEAN DEFAULT false,
  meeting_link TEXT,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('networking', 'professional', 'social', 'educational', 'reunion', 'fundraising', 'workshop', 'other')),
  max_attendees INTEGER,
  registered_count INTEGER DEFAULT 0,
  image_url TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  requires_approval BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  requires_registration BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('pending', 'registered', 'cancelled', 'attended')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  payment_amount DECIMAL(10, 2),
  UNIQUE(event_id, user_id)
);

-- 6. Notifications & Messaging
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS & Permissions
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Core Policies
DO $$ 
BEGIN 
    DROP POLICY IF EXISTS "Public read profiles" ON profiles;
    CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Users update own profile" ON profiles;
    CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Admins manage settings" ON public.system_settings;
    CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR (role IS NOT NULL AND role IN ('admin', 'super_admin')))));

    DROP POLICY IF EXISTS "Auth users read settings" ON public.system_settings;
    CREATE POLICY "Auth users read settings" ON public.system_settings FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "Users can view approved events" ON events;
    CREATE POLICY "Users can view approved events" ON events
      FOR SELECT USING (status IN ('approved', 'upcoming', 'ongoing', 'completed') OR organizer_id = auth.uid());

    DROP POLICY IF EXISTS "Users can create events" ON events;
    CREATE POLICY "Users can create events" ON events
      FOR INSERT WITH CHECK (auth.uid() = organizer_id);
END $$;

-- 8. Storage Buckets & Policies
-- ==========================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('public', 'public', true),
  ('avatars', 'avatars', true),
  ('marketplace', 'marketplace', true),
  ('cms', 'cms', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for 'public' bucket (used by profile uploads)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    CREATE POLICY "Public Access" ON storage.objects FOR SELECT 
    USING (bucket_id = 'public');

    DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
    CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'public');

    DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
    CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'public' AND auth.uid()::text = (storage.foldername(name))[1]);

    DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
    CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'public' AND auth.uid()::text = (storage.foldername(name))[1]);
END $$;

-- 9. Functions & Triggers
-- ==========================================

-- Registration Count Trigger
CREATE OR REPLACE FUNCTION update_event_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET registered_count = registered_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET registered_count = registered_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_registration_count ON event_registrations;
CREATE TRIGGER event_registration_count
AFTER INSERT OR DELETE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION update_event_registered_count();

-- 10. Clubs System
-- ==========================================
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  category VARCHAR(100),
  members_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure missing columns exist in case clubs table already existed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clubs' AND column_name='status') THEN
        ALTER TABLE clubs ADD COLUMN status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clubs' AND column_name='members_count') THEN
        ALTER TABLE clubs ADD COLUMN members_count INTEGER DEFAULT 0;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    DROP POLICY IF EXISTS "Public can view active clubs" ON clubs;
    CREATE POLICY "Public can view active clubs" ON clubs FOR SELECT USING (status = 'active');

    DROP POLICY IF EXISTS "Users can view club memberships" ON club_members;
    CREATE POLICY "Users can view club memberships" ON club_members FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Authenticated users can join clubs" ON club_members;
    CREATE POLICY "Authenticated users can join clubs" ON club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- 11. Social System (Friendships)
-- ==========================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
    CREATE POLICY "Users can view their own friendships" ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

    DROP POLICY IF EXISTS "Users can create friendship requests" ON friendships;
    CREATE POLICY "Users can create friendship requests" ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their received friend requests" ON friendships;
    CREATE POLICY "Users can update their received friend requests" ON friendships FOR UPDATE
    USING (auth.uid() = friend_id);

    DROP POLICY IF EXISTS "Users can delete their own friendships" ON friendships;
    CREATE POLICY "Users can delete their own friendships" ON friendships FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);
END $$;
