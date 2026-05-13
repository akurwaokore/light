-- SQL script to add missing logo_url column to jobs table
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Ensure the jobs table exists (it should, but safety first)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  currency TEXT DEFAULT 'KES',
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  employment_type TEXT,
  experience_level TEXT,
  skills TEXT[],
  is_remote BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add logo_url column if it doesn't exist
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 3. Verify columns (you can see the result in the editor)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND table_schema = 'public';

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload schema';
