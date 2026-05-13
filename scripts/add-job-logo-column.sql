-- Add logo_url column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs';
