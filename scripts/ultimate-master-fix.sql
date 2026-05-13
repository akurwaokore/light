-- ==========================================
-- Light Alumni Platform - Ultimate Master Setup Script
-- Includes: Fixes for Triggers, Constraints, Charts, and Admin Account
-- ==========================================

-- 1. PROFILES SCHEMA FIXES
-- ==========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Clean existing data
UPDATE public.profiles SET status = 'active' WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'suspended');

-- Re-add robust status constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

-- 2. TRIGGER FIX (ROBUST NEW USER HANDLING)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, status, membership_tier, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'active',
    'free',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.full_name,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SYSTEM SETTINGS (INCLUDING PESAPAL)
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

-- 4. DASHBOARD ANALYTICS FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION get_member_distribution()
RETURNS TABLE (name TEXT, value BIGINT, color TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN graduation_year >= 2020 THEN 'Class of 2020+'
      WHEN graduation_year BETWEEN 2010 AND 2019 THEN 'Class of 2010-2019'
      WHEN graduation_year BETWEEN 2000 AND 2009 THEN 'Class of 2000-2009'
      ELSE 'Before 2000'
    END as name,
    COUNT(*)::BIGINT as value,
    CASE 
      WHEN graduation_year >= 2020 THEN 'hsl(var(--primary))'
      WHEN graduation_year BETWEEN 2010 AND 2019 THEN 'hsl(var(--chart-2))'
      WHEN graduation_year BETWEEN 2000 AND 2009 THEN 'hsl(var(--chart-3))'
      ELSE 'hsl(var(--chart-4))'
    END as color
  FROM public.profiles
  GROUP BY name, color
  ORDER BY name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_member_growth()
RETURNS TABLE (month TEXT, members BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      date_trunc('year', now()),
      date_trunc('month', now()),
      '1 month'::interval
    ) as month_date
  )
  SELECT 
    to_char(m.month_date, 'Mon') as month,
    (SELECT count(*) FROM public.profiles p WHERE p.created_at <= m.month_date + '1 month'::interval - '1 second'::interval)::BIGINT as members
  FROM months m
  ORDER BY m.month_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ADMIN ACCOUNT SETUP (edamoke@gmail.com)
-- ==========================================
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'edamoke@gmail.com';

    IF new_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
            'edamoke@gmail.com', crypt('HobbitKing@20132', gen_salt('bf')),
            now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin", "full_name":"Admin User"}',
            now(), now(), '', '', '', ''
        )
        RETURNING id INTO new_user_id;
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('HobbitKing@20132', gen_salt('bf')), updated_at = now() WHERE id = new_user_id;
    END IF;

    INSERT INTO public.profiles (id, email, display_name, full_name, status, is_admin, updated_at)
    VALUES (new_user_id, 'edamoke@gmail.com', 'Admin', 'Admin User', 'active', true, now())
    ON CONFLICT (id) DO UPDATE SET is_admin = true, status = 'active', full_name = 'Admin User', updated_at = now();

    RAISE NOTICE 'Platform fully configured and Admin account ready.';
END $$;
