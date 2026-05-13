-- ==========================================
-- Light Alumni Platform - Master SQL Script
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  category_id UUID,
  image_urls TEXT[],
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'sold')),
  product_type VARCHAR(20) DEFAULT 'product' CHECK (product_type IN ('product', 'service')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  product_type VARCHAR(20) DEFAULT 'product' CHECK (product_type IN ('product', 'service')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO product_categories (name, description, product_type) VALUES
  ('Electronics', 'Computers, phones, gadgets, and electronic devices', 'product'),
  ('Fashion', 'Clothing, accessories, and fashion items', 'product'),
  ('Vehicles', 'Cars, motorcycles, and other vehicles', 'product'),
  ('Services', 'Professional services offered by alumni', 'service'),
  ('Consulting', 'Business and professional consulting services', 'service')
ON CONFLICT DO NOTHING;

-- 4. Careers & Job Board
-- ==========================================
CREATE TABLE IF NOT EXISTS job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')),
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'active', 'closed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO job_categories (name) VALUES ('Technology'), ('Healthcare'), ('Education'), ('Finance') ON CONFLICT DO NOTHING;

-- 5. Events & Clubs
-- ==========================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notifications
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS & Permissions
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- Simple Policies
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Auth users read settings" ON public.system_settings FOR SELECT TO authenticated USING (true);

-- Storage (Bucket must be created in Dashboard if not exists)
-- marketplace bucket
