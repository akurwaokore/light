-- 1. FIX THE PROFILES TABLE COLUMN AND CONSTRAINTS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Drop the problematic constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Fix any existing rows that might have invalid statuses before re-adding the constraint
UPDATE public.profiles SET status = 'active' WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'suspended');

-- Re-add the constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

-- 2. CREATE THE ADMIN ACCOUNT
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if user already exists
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'edamoke@gmail.com';

    IF new_user_id IS NULL THEN
        -- Create user if they don't exist
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

    -- Ensure profile exists and has admin rights
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        full_name,
        is_admin,
        status,
        membership_tier,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'edamoke@gmail.com',
        'Admin',
        'Admin User',
        true,
        'active',
        'free',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        is_admin = true,
        full_name = 'Admin User',
        status = 'active',
        updated_at = now();

    RAISE NOTICE 'Admin user edamoke@gmail.com setup successfully.';
END $$;
