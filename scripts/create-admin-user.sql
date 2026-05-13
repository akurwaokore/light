-- Create admin user and profile
-- This script creates a new admin user for the AlumniConnect platform

-- Step 1: Create the admin user in auth.users
-- Note: In production, use Supabase dashboard or auth API to create users
-- For this script, we'll create the profile entry

-- Step 2: Create profile entry for admin user
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  is_admin,
  status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@alumniconnect.com',
  'Admin User',
  true,
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  updated_at = NOW();

-- Step 3: Create admin role entry
INSERT INTO public.user_roles (
  id,
  user_id,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'super_admin',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Display confirmation
SELECT 
  id,
  email,
  display_name,
  is_admin,
  status
FROM public.profiles
WHERE is_admin = true
ORDER BY created_at DESC
LIMIT 5;
