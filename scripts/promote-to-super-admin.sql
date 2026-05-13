-- Promote user to Super Admin
-- We'll identify the user by email from the admin panel screenshot: admin@alumniconnect.com
-- or we can use the currently logged in user's ID if we knew it. 
-- Since I can't run this interactively, I'll provide a script that handles it based on email.

DO $$
DECLARE
    target_user_id UUID;
    super_admin_role_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id FROM public.profiles WHERE email = 'admin@alumniconnect.com';
    
    -- Get the Super Admin role ID
    SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';

    IF target_user_id IS NOT NULL AND super_admin_role_id IS NOT NULL THEN
        -- Ensure they are marked as is_admin in profiles
        UPDATE public.profiles SET is_admin = true WHERE id = target_user_id;

        -- Assign the super_admin role
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (target_user_id, super_admin_role_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
