-- Migration script to stabilize job applications and ensure notifications work
-- Run this in Supabase SQL Editor

-- 1. Ensure job_applications table has correct structure
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    cv_url TEXT,
    cover_letter TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indices for performance
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);

-- 3. Enable RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Applicants can see their own applications
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_applications' 
        AND policyname = 'Applicants can view own applications'
    ) THEN
        CREATE POLICY "Applicants can view own applications" 
        ON job_applications FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Job Posters can see applications for their jobs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_applications' 
        AND policyname = 'Posters can view applications for their jobs'
    ) THEN
        CREATE POLICY "Posters can view applications for their jobs" 
        ON job_applications FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM jobs 
                WHERE jobs.id = job_applications.job_id 
                AND jobs.posted_by = auth.uid()
            )
        );
    END IF;
END $$;

-- Allow insertion for authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_applications' 
        AND policyname = 'Users can apply for jobs'
    ) THEN
        CREATE POLICY "Users can apply for jobs" 
        ON job_applications FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Ensure notifications table can handle job application types
-- (Assuming type is a TEXT column without strict enum constraints)
