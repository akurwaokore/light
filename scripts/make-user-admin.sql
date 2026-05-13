-- Make user with email sbirzhan@gmail.com a super admin
-- This script updates the profiles table to grant admin privileges

UPDATE profiles 
SET is_admin = true 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'sbirzhan@gmail.com'
);

-- Verify the update
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.is_admin
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'sbirzhan@gmail.com';
