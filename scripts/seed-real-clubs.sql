-- Seed real clubs and location chapters added by sbirzhan@gmail.com
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- 1. Get the admin user ID for sbirzhan@gmail.com
    SELECT id INTO v_admin_id FROM profiles WHERE email = 'sbirzhan@gmail.com';

    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'Admin user sbirzhan@gmail.com not found. Please ensure the user exists and is an admin.';
        RETURN;
    END IF;

    -- 2. Clear existing dummy clubs (optional, but requested to make sure all are real)
    -- DELETE FROM clubs; 

    -- 3. Insert Real Location Chapters
    INSERT INTO clubs (id, name, description, category, creator_id, status, is_private)
    VALUES
        (gen_random_uuid(), 'Nairobi Chapter', 'The largest alumni community in East Africa. Regular meetups, networking events, and mentorship programs.', 'regional', v_admin_id, 'active', false),
        (gen_random_uuid(), 'Mombasa Chapter', 'Coastal alumni community connecting professionals along the Kenyan coast and beyond.', 'regional', v_admin_id, 'active', false),
        (gen_random_uuid(), 'United Kingdom Chapter', 'Connect with fellow alumni across England, Scotland, Wales, and Northern Ireland.', 'regional', v_admin_id, 'active', false),
        (gen_random_uuid(), 'United States Chapter', 'Network with the vibrant American community of Light Alumni.', 'regional', v_admin_id, 'active', false),
        (gen_random_uuid(), 'Europe Chapter', 'Join alumni across Germany, France, Netherlands, and other European countries.', 'regional', v_admin_id, 'active', false),
        (gen_random_uuid(), 'Malaysia Chapter', 'Connect with Light Alumni in Malaysia and Southeast Asia.', 'regional', v_admin_id, 'active', false)
    ON CONFLICT (name) DO NOTHING;

    -- 4. Insert Real Interest-Based Groups
    INSERT INTO clubs (id, name, description, category, creator_id, status, is_private)
    VALUES
        (gen_random_uuid(), 'Tech Innovators', 'For alumni in technology, engineering, and software development.', 'interest', v_admin_id, 'active', false),
        (gen_random_uuid(), 'Healthcare Professionals', 'Network for alumni in the medical and healthcare industry.', 'interest', v_admin_id, 'active', false),
        (gen_random_uuid(), 'Creative Arts & Media', 'For photographers, designers, writers, and media professionals.', 'interest', v_admin_id, 'active', false),
        (gen_random_uuid(), 'Entrepreneurship Circle', 'Business owners and startup founders sharing experiences and opportunities.', 'interest', v_admin_id, 'active', false),
        (gen_random_uuid(), 'Sports & Fitness', 'Alumni interested in athletics, football, gym, and healthy living.', 'interest', v_admin_id, 'active', false)
    ON CONFLICT (name) DO NOTHING;

    -- 5. Insert Batch Groups
    INSERT INTO clubs (id, name, description, category, creator_id, status, is_private)
    VALUES
        (gen_random_uuid(), 'Class of 2015', 'Reconnect with your 2015 graduation class.', 'batch', v_admin_id, 'active', false),
        (gen_random_uuid(), 'Class of 2020', 'Stay connected with your classmates from 2020.', 'batch', v_admin_id, 'active', false)
    ON CONFLICT (name) DO NOTHING;

END $$;
