-- Seed real location chapters and clubs, and ensure sbirzhan@gmail.com is an admin
DO $$
DECLARE
    v_admin_id UUID;
    v_role_id UUID;
BEGIN
    -- 1. Ensure sbirzhan@gmail.com exists and is set as admin
    UPDATE profiles 
    SET is_admin = true, role = 'admin' 
    WHERE email = 'sbirzhan@gmail.com';

    SELECT id INTO v_admin_id FROM profiles WHERE email = 'sbirzhan@gmail.com';

    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'User sbirzhan@gmail.com not found in profiles table. Please ensure they have signed up first.';
    ELSE
        -- 2. Ensure Super Admin role exists and assign to user
        SELECT id INTO v_role_id FROM roles WHERE name = 'super_admin';
        
        IF v_role_id IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id)
            VALUES (v_admin_id, v_role_id)
            ON CONFLICT DO NOTHING;
        END IF;

        -- 3. Clean up duplicates before adding unique constraint
        DELETE FROM clubs a
        USING clubs b
        WHERE a.id > b.id AND a.name = b.name;

        -- 4. Now safely add the unique constraint
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clubs_name_key') THEN
            ALTER TABLE clubs ADD CONSTRAINT clubs_name_key UNIQUE (name);
        END IF;

        -- 5. Insert/Update Real Location Chapters
        INSERT INTO clubs (name, description, category, status, members_count, creator_id)
        VALUES
            ('Nairobi Chapter', 'The largest alumni community in East Africa. Regular meetups, networking events, and mentorship programs.', 'regional', 'active', 523, v_admin_id),
            ('Mombasa Chapter', 'Coastal alumni community connecting professionals along the Kenyan coast and beyond.', 'regional', 'active', 187, v_admin_id),
            ('United Kingdom Chapter', 'Connect with fellow alumni across England, Scotland, Wales, and Northern Ireland.', 'regional', 'active', 156, v_admin_id),
            ('United States Chapter', 'Network with the vibrant American community of Light Alumni.', 'regional', 'active', 245, v_admin_id),
            ('Europe Chapter', 'Join alumni across Germany, France, Netherlands, and other European countries.', 'regional', 'active', 132, v_admin_id),
            ('Malaysia Chapter', 'Connect with Light Alumni in Malaysia and Southeast Asia.', 'regional', 'active', 89, v_admin_id)
        ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            members_count = EXCLUDED.members_count,
            creator_id = EXCLUDED.creator_id;

        -- 6. Insert/Update Real Interest-Based Groups
        INSERT INTO clubs (name, description, category, status, members_count, creator_id)
        VALUES
            ('Tech Innovators', 'For alumni in technology, engineering, and software development.', 'interest', 'active', 342, v_admin_id),
            ('Healthcare Professionals', 'Network for alumni in the medical and healthcare industry.', 'interest', 'active', 128, v_admin_id),
            ('Creative Arts & Media', 'For photographers, designers, writers, and media professionals.', 'interest', 'active', 95, v_admin_id),
            ('Entrepreneurship Circle', 'Business owners and startup founders sharing experiences and opportunities.', 'interest', 'active', 167, v_admin_id),
            ('Sports & Fitness', 'Alumni interested in athletics, football, gym, and healthy living.', 'interest', 'active', 210, v_admin_id)
        ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            members_count = EXCLUDED.members_count,
            creator_id = EXCLUDED.creator_id;
            
        RAISE NOTICE 'Real clubs and chapters seeded successfully for sbirzhan@gmail.com';
    END IF;
END $$;
