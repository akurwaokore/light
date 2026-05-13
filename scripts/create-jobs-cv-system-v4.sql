-- Job Categories (Admin managed)
CREATE TABLE IF NOT EXISTS job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Job Listings
CREATE TABLE IF NOT EXISTS job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  poster_name TEXT NOT NULL,
  poster_email TEXT NOT NULL,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  responsibilities TEXT[] DEFAULT '{}',
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_range TEXT,
  category_id UUID REFERENCES job_categories(id),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  skills_required TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  application_deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'active', 'closed', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  views INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CVs and Profiles
CREATE TABLE IF NOT EXISTS cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  parsed_text TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
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

-- Job Matches (AI Generated)
CREATE TABLE IF NOT EXISTS job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  matching_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  match_reasons TEXT[] DEFAULT '{}',
  ai_recommendation TEXT,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cv_id, job_id)
);

-- Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  cv_id UUID REFERENCES cvs(id),
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON job_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_poster ON job_listings(poster_id);
CREATE INDEX IF NOT EXISTS idx_cvs_user ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_status ON cvs(status);
CREATE INDEX IF NOT EXISTS idx_job_matches_cv ON job_matches(cv_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_job ON job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_score ON job_matches(match_score);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_id);

-- Trigger to notify admin when job is submitted
CREATE OR REPLACE FUNCTION notify_admin_new_job()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    profiles.user_id,
    'new_submission',
    'New Job Posting Awaiting Approval',
    NEW.title || ' by ' || NEW.poster_name,
    '/admin/jobs/pending',
    jsonb_build_object('job_id', NEW.id, 'job_title', NEW.title)
  FROM profiles
  WHERE role IN ('admin', 'super_admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_admin_new_job
AFTER INSERT ON job_listings
FOR EACH ROW
WHEN (NEW.status = 'pending_approval')
EXECUTE FUNCTION notify_admin_new_job();

-- Trigger to notify user when job is approved/rejected
CREATE OR REPLACE FUNCTION notify_user_job_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending_approval' THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.poster_id,
      'product_approved',
      'Job Posting Approved',
      'Your job posting "' || NEW.title || '" has been approved and is now live.',
      '/careers',
      jsonb_build_object('job_id', NEW.id)
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending_approval' THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.poster_id,
      'product_rejected',
      'Job Posting Rejected',
      'Your job posting "' || NEW.title || '" was rejected. ' || COALESCE(NEW.rejection_reason, ''),
      '/careers',
      jsonb_build_object('job_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_user_job_status
AFTER UPDATE ON job_listings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_user_job_status();

-- Trigger to notify users of job matches
CREATE OR REPLACE FUNCTION notify_user_job_match()
RETURNS TRIGGER AS $$
DECLARE
  cv_user_id UUID;
  job_title TEXT;
BEGIN
  -- Get user_id from CV
  SELECT user_id INTO cv_user_id FROM cvs WHERE id = NEW.cv_id;
  
  -- Get job title
  SELECT title INTO job_title FROM job_listings WHERE id = NEW.job_id;
  
  -- Create notification if match score is high enough
  IF NEW.match_score >= 70 AND NOT NEW.notified THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      cv_user_id,
      'recommended_job',
      'New Job Match Found!',
      'We found a ' || NEW.match_score || '% match for "' || job_title || '"',
      '/careers?job=' || NEW.job_id,
      jsonb_build_object('job_id', NEW.job_id, 'match_score', NEW.match_score)
    );
    
    -- Mark as notified
    NEW.notified = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_user_job_match
BEFORE INSERT ON job_matches
FOR EACH ROW
EXECUTE FUNCTION notify_user_job_match();

-- RLS Policies
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Job Categories: Everyone can read, only admins can manage
CREATE POLICY "Anyone can view job categories" ON job_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage job categories" ON job_categories FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Job Listings: Public read for approved, poster can manage their own
CREATE POLICY "Anyone can view active jobs" ON job_listings FOR SELECT TO authenticated 
  USING (status = 'active' OR poster_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY "Users can create job listings" ON job_listings FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Users can update their own job listings" ON job_listings FOR UPDATE TO authenticated 
  USING (auth.uid() = poster_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- CVs: Users can only see their own
CREATE POLICY "Users can view their own CV" ON cvs FOR SELECT TO authenticated 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY "Users can manage their own CV" ON cvs FOR ALL TO authenticated 
  USING (auth.uid() = user_id);

-- Job Matches: Users can only see their own matches
CREATE POLICY "Users can view their own job matches" ON job_matches FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM cvs WHERE cvs.id = job_matches.cv_id AND cvs.user_id = auth.uid()));

-- Job Applications: Users can see their own, job posters can see applications to their jobs
CREATE POLICY "Users can view relevant applications" ON job_applications FOR SELECT TO authenticated 
  USING (
    auth.uid() = applicant_id 
    OR EXISTS (SELECT 1 FROM job_listings WHERE job_listings.id = job_applications.job_id AND job_listings.poster_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can create applications" ON job_applications FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can update their own applications" ON job_applications FOR UPDATE TO authenticated 
  USING (
    auth.uid() = applicant_id 
    OR EXISTS (SELECT 1 FROM job_listings WHERE job_listings.id = job_applications.job_id AND job_listings.poster_id = auth.uid())
  );

-- Insert default categories
INSERT INTO job_categories (name, description, icon) VALUES
  ('Technology', 'Software development, IT, and tech roles', 'laptop'),
  ('Healthcare', 'Medical, nursing, and healthcare professions', 'heart-pulse'),
  ('Education', 'Teaching, training, and education roles', 'graduation-cap'),
  ('Business', 'Management, consulting, and business development', 'briefcase'),
  ('Finance', 'Banking, accounting, and financial services', 'dollar-sign'),
  ('Marketing', 'Marketing, advertising, and communications', 'megaphone'),
  ('Engineering', 'Civil, mechanical, electrical engineering', 'wrench'),
  ('Legal', 'Law, legal services, and compliance', 'scale'),
  ('Creative', 'Design, art, and creative professions', 'palette'),
  ('Sales', 'Sales, retail, and customer service', 'shopping-cart')
ON CONFLICT (name) DO NOTHING;
