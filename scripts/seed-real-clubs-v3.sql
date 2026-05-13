-- Migration to seed real location chapters and clubs, and ensure sbirzhan@gmail.com is an admin
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- 1. Ensure sbirzhan@gmail.com exists and is set as admin
    UPDATE profiles 
    SET is_admin = true, role = 'admin' 
    WHERE email = 'sbirzhan@gmail.com';

    SELECT id INTO v_admin_id FROM profiles WHERE email = 'sbirzhan@gmail.com';

    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'User sbirzhan@gmail.com not found in profiles table. Please ensure they have signed up first.';
    ELSE
        -- 2. Insert Real Location Chapters
        -- We use ON CONFLICT (name) DO UPDATE to handle existing clubs
        INSERT INTO clubs (name, description, category, status, is_private, members_count)
        VALUES
            ('Nairobi Chapter', 'The largest alumni community in East Africa. Regular meetups, networking events, and mentorship programs.', 'regional', 'active', false, 523),
            ('Mombasa Chapter', 'Coastal alumni community connecting professionals along the Kenyan coast and beyond.', 'regional', 'active', false, 187),
            ('United Kingdom Chapter', 'Connect with fellow alumni across England, Scotland, Wales, and Northern Ireland.', 'regional', 'active', false, 156),
            ('United States Chapter', 'Network with the vibrant American community of Light Alumni.', 'regional', 'active', false, 245),
            ('Europe Chapter', 'Join alumni across Germany, France, Netherlands, and other European countries.', 'regional', 'active', false, 132),
            ('Malaysia Chapter', 'Connect with Light Alumni in Malaysia and Southeast Asia.', 'regional', 'active', false, 89)
        ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            members_count = EXCLUDED.members_count;

        -- 3. Insert Real Interest-Based Groups
        INSERT INTO clubs (name, description, category, status, is_private, members_count)
        VALUES
            ('Tech Innovators', 'For alumni in technology, engineering, and software development.', 'interest', 'active', false, 342),
            ('Healthcare Professionals', 'Network for alumni in the medical and healthcare industry.', 'interest', 'active', false, 128),
            ('Creative Arts & Media', 'For photographers, designers, writers, and media professionals.', 'interest', 'active', false, 95),
            ('Entrepreneurship Circle', 'Business owners and startup founders sharing experiences and opportunities.', 'interest', 'active', false, 167),
            ('Sports & Fitness', 'Alumni interested in athletics, football, gym, and healthy living.', 'interest', 'active', false, 210)
        ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            members_count = EXCLUDED.members_count;
            
        RAISE NOTICE 'Real clubs and chapters seeded successfully for sbirzhan@gmail.com';
    END IF;
END $$;
