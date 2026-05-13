-- Create CVs table if it does not exist, then add structured fields
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

-- Update CVs table to match new requirements
ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
ADD COLUMN IF NOT EXISTS technical_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS soft_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages_json JSONB DEFAULT '[]', -- [{name, proficiency}]
ADD COLUMN IF NOT EXISTS education_json JSONB DEFAULT '[]', -- [{institution, degree, field, start_year, end_year, grade}]
ADD COLUMN IF NOT EXISTS experience_json JSONB DEFAULT '[]', -- [{company, title, period, responsibilities}]
ADD COLUMN IF NOT EXISTS certifications_json JSONB DEFAULT '[]', -- [{name, organization, year}]
ADD COLUMN IF NOT EXISTS volunteer_json JSONB DEFAULT '[]', -- [{organization, role, period, description}]
ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT FALSE;

-- Ensure RLS is enabled
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cvs' AND policyname = 'Users can view their own CV') THEN
        CREATE POLICY "Users can view their own CV" ON cvs FOR SELECT TO authenticated 
          USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND status = 'active'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cvs' AND policyname = 'Users can manage their own CV') THEN
        CREATE POLICY "Users can manage their own CV" ON cvs FOR ALL TO authenticated 
          USING (auth.uid() = user_id);
    END IF;
END $$;
