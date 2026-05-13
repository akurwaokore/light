-- Enable storage and set policies for the 'public' bucket

-- 1. Ensure bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'public';

-- 2. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own objects" ON storage.objects;

-- 3. Create permissive policies for 'public' bucket
-- Allow anyone to view objects
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'public');

-- Allow authenticated users to upload to 'public' bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'public');

-- Allow users to update their own objects
CREATE POLICY "Allow users to update own objects" ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner);

-- Allow users to delete their own objects
CREATE POLICY "Allow users to delete own objects" ON storage.objects 
FOR DELETE 
TO authenticated 
USING (auth.uid() = owner);
