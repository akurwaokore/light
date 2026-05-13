-- 1. FIX THE PROFILES TABLE COLUMN FIRST
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

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
    -- This part is usually handled by your trigger, but we'll do it explicitly too just in case
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        full_name,
        is_admin,
        status,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'edamoke@gmail.com',
        'Admin',
        'Admin User',
        true,
        'active',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        is_admin = true,
        full_name = 'Admin User',
        updated_at = now();

    RAISE NOTICE 'Admin user edamoke@gmail.com setup successfully.';
END $$;
