-- 1. FIX THE PROFILES TABLE SCHEMA AND TRIGGER
-- ==========================================

-- Fix the missing column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Drop constraints that might interfere with the trigger
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Update the handle_new_user function to be more robust
-- This function seems to be what's causing the error by trying to insert 'other' or missing 'active'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, status, membership_tier)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'active',
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.full_name,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-add the status constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

-- 2. CREATE THE ADMIN ACCOUNT
-- ==========================================
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if user already exists
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'edamoke@gmail.com';

    IF new_user_id IS NULL THEN
        -- Create user if they don't exist
        -- Note: The trigger handle_new_user() will run immediately after this insert
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'edamoke@gmail.com',
            crypt('HobbitKing@20132', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"display_name":"Admin", "full_name":"Admin User"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO new_user_id;
    ELSE
        -- Update password for existing user
        UPDATE auth.users 
        SET encrypted_password = crypt('HobbitKing@20132', gen_salt('bf')),
            updated_at = now()
        WHERE id = new_user_id;
    END IF;

    -- Ensure the profile is marked as admin
    UPDATE public.profiles 
    SET is_admin = true,
        status = 'active',
        full_name = 'Admin User'
    WHERE id = new_user_id;

    RAISE NOTICE 'Admin user setup complete.';
END $$;
