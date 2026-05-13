-- 1. Ensure Job Applications table structure and RLS
-- This script ensures that users can see their own applications and job posters can see applications to their jobs.

-- Check if job_applications table exists and has correct columns
DO $$ 
BEGIN
    -- Ensure user_id column exists (alias for applicant_id in some contexts)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'user_id') THEN
        ALTER TABLE job_applications ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        -- Backfill user_id from applicant_id if it existed
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'applicant_id') THEN
            UPDATE job_applications SET user_id = applicant_id WHERE user_id IS NULL;
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view relevant applications" ON job_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON job_applications;
DROP POLICY IF EXISTS "Job posters can view applications to their jobs" ON job_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON job_applications;

-- Create comprehensive SELECT policy
CREATE POLICY "Users can view relevant applications" ON job_applications
FOR SELECT TO authenticated
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM job_listings 
        WHERE job_listings.id = job_applications.job_id 
        AND job_listings.poster_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin')
    )
);

-- Ensure INSERT policy exists
DROP POLICY IF EXISTS "Users can create applications" ON job_applications;
CREATE POLICY "Users can create applications" ON job_applications
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

-- Ensure UPDATE policy exists (for status updates by posters or withdrawals by applicants)
DROP POLICY IF EXISTS "Users can update their own applications" ON job_applications;
CREATE POLICY "Users can update their own applications" ON job_applications
FOR UPDATE TO authenticated
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM job_listings 
        WHERE job_listings.id = job_applications.job_id 
        AND job_listings.poster_id = auth.uid()
    )
);

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
