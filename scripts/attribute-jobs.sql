-- Attribute all jobs to sbirzhan@gmail.com
-- This script updates both potential job tables with dynamic column checking

DO $$
DECLARE
    target_user_id UUID;
    target_display_name TEXT;
BEGIN
    -- 1. Find the user ID and name
    SELECT id, display_name INTO target_user_id, target_display_name
    FROM profiles
    WHERE email = 'sbirzhan@gmail.com'
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User sbirzhan@gmail.com not found in profiles';
        RETURN;
    END IF;

    RAISE NOTICE 'Found user % (%)', target_display_name, target_user_id;

    -- 2. Update jobs table (used in app/api/jobs/route.ts)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'jobs') THEN
        UPDATE jobs 
        SET posted_by = target_user_id 
        WHERE posted_by IS DISTINCT FROM target_user_id;
        RAISE NOTICE 'Updated jobs table';
    END IF;

    -- 3. Update job_listings table (used in some scripts)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_listings') THEN
        -- Dynamically build the update query based on existing columns
        EXECUTE (
            SELECT 'UPDATE job_listings SET ' || 
                   string_agg(column_name || ' = ' || quote_literal(
                       CASE 
                           WHEN column_name = 'poster_id' THEN target_user_id::text
                           WHEN column_name = 'poster_email' THEN 'sbirzhan@gmail.com'
                           WHEN column_name = 'poster_name' THEN COALESCE(target_display_name, 'Birzhan Shaimardan')
                       END
                   ), ', ') || 
                   ' WHERE poster_id IS DISTINCT FROM ' || quote_literal(target_user_id::text)
            FROM information_schema.columns 
            WHERE table_name = 'job_listings' 
              AND column_name IN ('poster_id', 'poster_email', 'poster_name')
        );
        RAISE NOTICE 'Updated job_listings table (columns found were updated)';
    END IF;

END $$;
