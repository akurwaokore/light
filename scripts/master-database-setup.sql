-- ==========================================
-- Light Alumni Platform - Master Database Consolidation
-- This script contains all structural updates for the platform
-- ==========================================

-- 1. Profiles & Users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
UPDATE public.profiles SET status = 'active' WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'suspended');
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

-- 2. System Settings & Payment (Pesapal)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    siteName TEXT DEFAULT 'Light Alumni Connect',
    pesapalConsumerKey TEXT DEFAULT '',
    pesapalConsumerSecret TEXT DEFAULT '',
    pesapalEnvironment TEXT DEFAULT 'sandbox',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT one_row_only CHECK (id = 1)
);

-- 3. Job Listings
CREATE TABLE IF NOT EXISTS public.job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary_range TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending_approval',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Marketplace Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    price DECIMAL(12,2),
    description TEXT,
    status TEXT DEFAULT 'pending_approval',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Donation Campaigns
CREATE TABLE IF NOT EXISTS public.donation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    target_amount DECIMAL(12,2),
    current_amount DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Newsletters
CREATE TABLE IF NOT EXISTS public.newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT,
    content TEXT,
    status TEXT DEFAULT 'draft',
    recipients INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Analytics Functions
CREATE OR REPLACE FUNCTION get_member_distribution()
RETURNS TABLE (name TEXT, value BIGINT, color TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN graduation_year >= 2020 THEN 'Class of 2020+'
      WHEN graduation_year BETWEEN 2010 AND 2019 THEN 'Class of 2010-2019'
      ELSE 'Older Alumni'
    END as name,
    COUNT(*)::BIGINT as value,
    'hsl(var(--primary))' as color
  FROM public.profiles
  GROUP BY name;
END;
$$ LANGUAGE plpgsql;
