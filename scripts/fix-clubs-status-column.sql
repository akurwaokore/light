-- Fix for missing status column in clubs table
DO $$ 
BEGIN 
    -- 1. Ensure the status column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clubs' AND column_name='status') THEN
        ALTER TABLE clubs ADD COLUMN status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));
    END IF;

    -- 2. Drop the problematic policy if it exists
    DROP POLICY IF EXISTS "Public can view active clubs" ON clubs;

    -- 3. Re-create the policy (now that we're sure the column exists)
    CREATE POLICY "Public can view active clubs" ON clubs FOR SELECT USING (status = 'active');
END $$;
