-- Fix Events Table Schema and Constraints
-- Run this in Supabase SQL Editor

-- 1. Ensure all expected columns exist with correct names
DO $$
BEGIN
    -- Check and rename start_date to date if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'start_date') THEN
        ALTER TABLE events RENAME COLUMN start_date TO date;
    END IF;

    -- Check and rename event_type to category if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type') THEN
        ALTER TABLE events RENAME COLUMN event_type TO category;
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'time') THEN
        ALTER TABLE events ADD COLUMN time TIME DEFAULT '12:00';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'end_time') THEN
        ALTER TABLE events ADD COLUMN end_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_virtual') THEN
        ALTER TABLE events ADD COLUMN is_virtual BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'google_meet_link') THEN
        ALTER TABLE events ADD COLUMN google_meet_link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'max_attendees') THEN
        ALTER TABLE events ADD COLUMN max_attendees INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'registered_count') THEN
        ALTER TABLE events ADD COLUMN registered_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
        ALTER TABLE events ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'requires_approval') THEN
        ALTER TABLE events ADD COLUMN requires_approval BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_free') THEN
        ALTER TABLE events ADD COLUMN is_free BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'ticket_price') THEN
        ALTER TABLE events ADD COLUMN ticket_price DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- 2. Update status check constraint
-- First drop existing constraint if it exists (may be named events_status_check)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add updated constraint
ALTER TABLE events ADD CONSTRAINT events_status_check 
CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'upcoming', 'ongoing', 'completed', 'cancelled'));

-- 3. Update category check constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE events ADD CONSTRAINT events_category_check 
CHECK (category IN ('networking', 'professional', 'social', 'educational', 'reunion', 'fundraising', 'workshop', 'other'));

-- 4. Ensure organizer_id is linked correctly to profiles
-- Some older versions might have linked to auth.users directly
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;
ALTER TABLE events ADD CONSTRAINT events_organizer_id_fkey 
FOREIGN KEY (organizer_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. Add triggers if missing (from v6)
-- Update registered count trigger
CREATE OR REPLACE FUNCTION update_event_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET registered_count = registered_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET registered_count = registered_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_registration_count ON event_registrations;
-- Check if event_registrations table exists before adding trigger
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_registrations') THEN
        CREATE TRIGGER event_registration_count
        AFTER INSERT OR DELETE ON event_registrations
        FOR EACH ROW EXECUTE FUNCTION update_event_registered_count();
    END IF;
END $$;
