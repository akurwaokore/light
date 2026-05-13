-- SQL script to set up CVs table and storage for CV uploads

-- 1. Create the 'cvs' table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_email TEXT,
    file_url TEXT,
    file_name TEXT,
    phone TEXT,
    city TEXT,
    country TEXT,
    linkedin_url TEXT,
    graduation_year INTEGER,
    technical_skills TEXT[],
    soft_skills TEXT[],
    education_json JSONB,
    experience_json JSONB,
    languages_json JSONB,
    certifications_json JSONB,
    volunteer_json JSONB,
    declaration_accepted BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Set up RLS for the 'cvs' table
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own CV
CREATE POLICY IF NOT EXISTS "Users can view their own CV" 
ON public.cvs FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own CV
CREATE POLICY IF NOT EXISTS "Users can update their own CV" 
ON public.cvs FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow public read access to active CVs for searchable alumni database (optional, or restrict to authenticated)
CREATE POLICY IF NOT EXISTS "Authenticated users can view all active CVs" 
ON public.cvs FOR SELECT 
TO authenticated
USING (status = 'active');

-- 3. Set up Storage for CVs
-- Create a 'documents' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for CVs
CREATE POLICY IF NOT EXISTS "Users can upload their own CVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'cvs' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can update their own CVs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'cvs' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can delete their own CVs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'cvs' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Public access to CVs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'cvs');
