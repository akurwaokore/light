-- Reset clubs and chapters to real data based on registered members
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- 1. Ensure sbirzhan@gmail.com is admin
    UPDATE profiles SET is_admin = true, role = 'admin' WHERE email = 'sbirzhan@gmail.com';
    SELECT id INTO v_admin_id FROM profiles WHERE email = 'sbirzhan@gmail.com';

    -- 2. Clean slate for clubs (remove any previous seeding)
    TRUNCATE clubs CASCADE;

    -- 3. Reset the unique constraint if it was missed
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clubs_name_key') THEN
        ALTER TABLE clubs ADD CONSTRAINT clubs_name_key UNIQUE (name);
    END IF;

    -- 4. Insert ONLY the skeleton for location chapters (actual data)
    -- We set members_count to 0 because there are no signups yet
    INSERT INTO clubs (name, description, category, status, members_count)
    VALUES
        ('Nairobi Chapter', 'Official alumni chapter for Nairobi and surrounding areas.', 'regional', 'active', 0),
        ('Mombasa Chapter', 'Official alumni chapter for the Coastal region.', 'regional', 'active', 0),
        ('United Kingdom Chapter', 'Connecting alumni residing in the UK.', 'regional', 'active', 0),
        ('United States Chapter', 'Connecting alumni residing in the US.', 'regional', 'active', 0)
    ON CONFLICT (name) DO NOTHING;

    -- 5. Insert Interest Groups
    INSERT INTO clubs (name, description, category, status, members_count)
    VALUES
        ('Tech Innovators', 'Professional group for alumni in technology.', 'interest', 'active', 0),
        ('Healthcare Professionals', 'Professional group for alumni in medical fields.', 'interest', 'active', 0),
        ('Creative Arts & Media', 'Group for designers, media, and artists.', 'interest', 'active', 0)
    ON CONFLICT (name) DO NOTHING;

    RAISE NOTICE 'Clubs reset to real zero-signup state.';
END $$;
