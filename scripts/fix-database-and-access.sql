-- Master SQL Script to Secure Admin Panel and Fix Missing Tables

-- 1. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  seller_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sold', 'expired')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  members_count INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  salary_range TEXT, -- Standardized naming
  description TEXT,
  posted_by UUID REFERENCES auth.users(id),
  posted_by_name TEXT,
  applications_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checkout_request_id TEXT UNIQUE,
  phone_number TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  type TEXT NOT NULL DEFAULT 'membership' CHECK (type IN ('membership', 'donation', 'marketplace')),
  payment_method TEXT DEFAULT 'mpesa' CHECK (payment_method IN ('mpesa', 'paypal', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Define Strict Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get current user email
    user_email := (SELECT email FROM auth.users WHERE id = auth.uid());

    -- Return true ONLY if email matches authorized list AND profile is flagged as admin
    RETURN (
        user_email IN ('sbirzhan@gmail.com', 'edamoke@gmail.com')
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reset and Set Official Admins
UPDATE profiles SET is_admin = FALSE;
UPDATE profiles SET is_admin = TRUE WHERE email IN ('sbirzhan@gmail.com', 'edamoke@gmail.com');

-- 4. Apply Global Admin Policies
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('marketplace_products', 'donation_campaigns', 'clubs', 'jobs', 'profiles', 'events', 'posts', 'transactions', 'job_applications', 'cms_sections')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Admins can do everything on %I" ON %I', t, t);
        EXECUTE format('CREATE POLICY "Admins can do everything on %I" ON %I FOR ALL USING (public.is_admin())', t, t);
    END LOOP;
END $$;

-- 5. Individual Policies for Users
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own job applications" ON job_applications;
CREATE POLICY "Users can view their own job applications" ON job_applications
    FOR SELECT USING (auth.uid() = user_id);
