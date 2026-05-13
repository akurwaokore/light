-- LIGHT ALUMNI MASTER UPDATE SCRIPT
-- Consolidated script for CVs, Notifications, and Profile Badges

-- 1. CMS SETTINGS INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS cms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE cms_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_settings' AND policyname = 'Anyone can view cms settings') THEN
        CREATE POLICY "Anyone can view cms settings" ON cms_settings FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_settings' AND policyname = 'Admins can manage cms settings') THEN
        CREATE POLICY "Admins can manage cms settings" ON cms_settings FOR ALL TO authenticated 
          USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND is_admin = true));
    END IF;
END $$;

INSERT INTO cms_settings (key, value)
VALUES ('logo', '{"url": "/logo.png", "alt": "Light Alumni Association"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- 2. ALUMNI CV & PROFILE EXPANSION
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'cvs') THEN
    CREATE TABLE cvs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      file_url TEXT,
      file_name TEXT,
      parsed_text TEXT,
      skills TEXT[] DEFAULT '{}',
      experience_level TEXT NOT NULL DEFAULT 'entry' CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
      education TEXT[] DEFAULT '{}',
      work_experience TEXT[] DEFAULT '{}',
      certifications TEXT[] DEFAULT '{}',
      languages TEXT[] DEFAULT '{}',
      summary TEXT,
      preferred_job_type TEXT[] DEFAULT '{}',
      preferred_location TEXT,
      preferred_salary_range TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
      profile_completion INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;

ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
ADD COLUMN IF NOT EXISTS technical_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS soft_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS education_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS experience_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS certifications_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS volunteer_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cvs' AND policyname = 'Users can view their own CV') THEN
        CREATE POLICY "Users can view their own CV" ON cvs FOR SELECT TO authenticated 
          USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND is_admin = true));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cvs' AND policyname = 'Users can manage their own CV') THEN
        CREATE POLICY "Users can manage their own CV" ON cvs FOR ALL TO authenticated 
          USING (auth.uid() = user_id);
    END IF;
END $$;


-- 3. DYNAMIC PROFILE BADGES (HIRING / OPEN TO WORK)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_hiring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_job_categories UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_job_types TEXT[] DEFAULT '{}';

-- Trigger for Hiring Status
CREATE OR REPLACE FUNCTION update_user_hiring_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.profiles
        SET is_hiring = EXISTS (
            SELECT 1 FROM public.jobs 
            WHERE posted_by = NEW.posted_by 
            AND status = 'active'
        )
        WHERE id = NEW.posted_by;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles
        SET is_hiring = EXISTS (
            SELECT 1 FROM public.jobs 
            WHERE posted_by = OLD.posted_by 
            AND status = 'active'
        )
        WHERE id = OLD.posted_by;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_hiring_status ON public.jobs;
CREATE TRIGGER tr_update_hiring_status
AFTER INSERT OR UPDATE OR DELETE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION update_user_hiring_status();


-- 4. REAL-TIME NOTIFICATION SYSTEM
-- Trigger for Marketplace Notifications
CREATE OR REPLACE FUNCTION notify_all_new_marketplace_item()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    SELECT 
        id, 
        'general', 
        'New in Marketplace: ' || NEW.title,
        'A new ' || NEW.product_type || ' has been listed by ' || NEW.seller_name,
        '/marketplace',
        jsonb_build_object('product_id', NEW.id, 'product_title', NEW.title)
    FROM profiles
    WHERE id != NEW.seller_id AND status = 'active';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_marketplace ON products;
CREATE TRIGGER tr_notify_marketplace
AFTER INSERT ON products
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION notify_all_new_marketplace_item();

-- Trigger for Job Match Notifications
CREATE OR REPLACE FUNCTION notify_matching_jobs()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    SELECT 
        id, 
        'general', 
        'Job Match Found: ' || NEW.title,
        'A new ' || NEW.employment_type || ' opening at ' || NEW.company || ' matches your profile.',
        '/careers',
        jsonb_build_object('job_id', NEW.id, 'job_title', NEW.title)
    FROM profiles
    WHERE id != NEW.posted_by 
    AND status = 'active'
    AND open_to_work = true
    AND (
        NEW.category_id = ANY(preferred_job_categories)
        OR 
        NEW.employment_type = ANY(preferred_job_types)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_job_match ON jobs;
CREATE TRIGGER tr_notify_job_match
AFTER INSERT ON jobs
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION notify_matching_jobs();
