-- Final refined seed script for real clubs and chapters based on design
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- 1. Get sbirzhan@gmail.com's profile ID
    SELECT id INTO v_admin_id FROM profiles WHERE email = 'sbirzhan@gmail.com';

    IF v_admin_id IS NULL THEN
        -- Fallback to first admin found if sbirzhan is not there
        SELECT id INTO v_admin_id FROM profiles WHERE is_admin = true LIMIT 1;
    END IF;

    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'No admin user found. Please ensure at least one admin exists.';
    ELSE
        -- 2. Ensure extra columns exist if needed (though we'll use existing ones mostly)
        -- We'll map region and next_meetup to metadata or similar if we had it, but for now we'll use name/description/category.
        
        -- 3. Insert/Update Real Location Chapters
        INSERT INTO clubs (name, description, category, status, members_count, creator_id, image_url)
        VALUES
            ('Nairobi Chapter', 'The largest alumni community in East Africa. Regular meetups, networking events, and mentorship programs.', 'regional', 'active', 523, v_admin_id, '/nairobi-kenya-skyline-cityscape.jpg'),
            ('Mombasa Chapter', 'Coastal alumni community connecting professionals along the Kenyan coast and beyond.', 'regional', 'active', 187, v_admin_id, '/mombasa-kenya-beach-coastal-city.jpg'),
            ('United Kingdom Chapter', 'Connect with fellow alumni across England, Scotland, Wales, and Northern Ireland.', 'regional', 'active', 156, v_admin_id, '/london-uk-big-ben-thames-river.jpg'),
            ('United States Chapter', 'Network with the vibrant American community of Light Alumni.', 'regional', 'active', 245, v_admin_id, '/new-york-city-skyline-manhattan.jpg'),
            ('Europe Chapter', 'Join alumni across Germany, France, Netherlands, and other European countries.', 'regional', 'active', 132, v_admin_id, '/berlin-germany-brandenburg-gate.jpg'),
            ('Malaysia Chapter', 'Connect with Light Alumni in Malaysia and Southeast Asia.', 'regional', 'active', 89, v_admin_id, '/kuala-lumpur-malaysia-petronas-towers.jpg')
        ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            members_count = EXCLUDED.members_count,
            creator_id = EXCLUDED.creator_id,
            image_url = EXCLUDED.image_url;

        -- 4. Insert/Update Real Interest-Based Groups
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
            
        RAISE NOTICE 'Real clubs and chapters seeded successfully.';
    END IF;
END $$;
