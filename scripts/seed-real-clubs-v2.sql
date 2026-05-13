-- Migration to seed real location chapters and clubs, and ensure sbirzhan@gmail.com is an admin
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- 1. Ensure sbirzhan@gmail.com exists and is set as admin
    -- This handles both cases: if the user exists in auth.users and if they exist in public.profiles
    -- We assume the user has already signed up via the UI.
    
    UPDATE profiles 
    SET is_admin = true, role = 'admin' 
    WHERE email = 'sbirzhan@gmail.com';

    SELECT id INTO v_admin_id FROM profiles WHERE email = 'sbirzhan@gmail.com';

    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'User sbirzhan@gmail.com not found in profiles table. Please ensure they have signed up first.';
    ELSE
        -- 2. Delete existing dummy clubs to ensure only real ones remain
        -- DELETE FROM club_members;
        -- DELETE FROM clubs;

        -- 3. Insert Real Location Chapters
        INSERT INTO clubs (name, description, category, creator_id, status, is_private, members_count)
        VALUES
            ('Nairobi Chapter', 'The largest alumni community in East Africa. Regular meetups, networking events, and mentorship programs.', 'regional', v_admin_id, 'active', false, 523),
            ('Mombasa Chapter', 'Coastal alumni community connecting professionals along the Kenyan coast and beyond.', 'regional', v_admin_id, 'active', false, 187),
            ('United Kingdom Chapter', 'Connect with fellow alumni across England, Scotland, Wales, and Northern Ireland.', 'regional', v_admin_id, 'active', false, 156),
            ('United States Chapter', 'Network with the vibrant American community of Light Alumni.', 'regional', v_admin_id, 'active', false, 245),
            ('Europe Chapter', 'Join alumni across Germany, France, Netherlands, and other European countries.', 'regional', v_admin_id, 'active', false, 132),
            ('Malaysia Chapter', 'Connect with Light Alumni in Malaysia and Southeast Asia.', 'regional', v_admin_id, 'active', false, 89)
        ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            members_count = EXCLUDED.members_count;

        -- 4. Insert Real Interest-Based Groups
        INSERT INTO clubs (name, description, category, creator_id, status, is_private, members_count)
        VALUES
            ('Tech Innovators', 'For alumni in technology, engineering, and software development.', 'interest', v_admin_id, 'active', false, 342),
            ('Healthcare Professionals', 'Network for alumni in the medical and healthcare industry.', 'interest', v_admin_id, 'active', false, 128),
            ('Creative Arts & Media', 'For photographers, designers, writers, and media professionals.', 'interest', v_admin_id, 'active', false, 95),
            ('Entrepreneurship Circle', 'Business owners and startup founders sharing experiences and opportunities.', 'interest', v_admin_id, 'active', false, 167),
            ('Sports & Fitness', 'Alumni interested in athletics, football, gym, and healthy living.', 'interest', v_admin_id, 'active', false, 210)
        ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            members_count = EXCLUDED.members_count;
            
        RAISE NOTICE 'Real clubs and chapters seeded successfully for sbirzhan@gmail.com';
    END IF;
END $$;
