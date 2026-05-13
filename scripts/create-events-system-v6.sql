-- Events Management System Tables
-- Run this script in Supabase SQL Editor

-- Drop existing events table if it exists (to recreate with full schema)
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Create events table with full management features
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME,
  location VARCHAR(255),
  is_virtual BOOLEAN DEFAULT false,
  google_meet_link TEXT,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('networking', 'professional', 'social', 'educational', 'reunion', 'fundraising', 'workshop', 'other')),
  max_attendees INTEGER,
  registered_count INTEGER DEFAULT 0,
  image_url TEXT,
  status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  requires_approval BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  requires_registration BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMPTZ,
  ticket_price DECIMAL(10, 2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('pending', 'registered', 'cancelled', 'attended')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  payment_amount DECIMAL(10, 2),
  UNIQUE(event_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Users can view approved events" ON events
  FOR SELECT USING (status IN ('approved', 'upcoming', 'ongoing', 'completed') OR organizer_id = auth.uid());

CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (auth.uid() = organizer_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- RLS Policies for event registrations
CREATE POLICY "Users can view own registrations" ON event_registrations
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events WHERE events.id = event_registrations.event_id AND events.organizer_id = auth.uid()
  ));

CREATE POLICY "Users can register for events" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registration" ON event_registrations
  FOR UPDATE USING (user_id = auth.uid());

-- Function to update registered count
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

-- Trigger for registration count
DROP TRIGGER IF EXISTS event_registration_count ON event_registrations;
CREATE TRIGGER event_registration_count
AFTER INSERT OR DELETE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION update_event_registered_count();

-- Function to notify admin when event needs approval
CREATE OR REPLACE FUNCTION notify_admin_event_approval()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  organizer_name TEXT;
BEGIN
  IF NEW.status = 'pending_approval' AND NEW.requires_approval = true THEN
    -- Get organizer name
    SELECT display_name INTO organizer_name FROM profiles WHERE id = NEW.organizer_id;
    
    -- Notify all admins
    FOR admin_id IN SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        admin_id,
        'admin_action_required',
        'New Event Pending Approval',
        'Event "' || NEW.title || '" submitted by ' || COALESCE(organizer_name, 'Unknown') || ' requires approval.',
        '/admin/events',
        jsonb_build_object('event_id', NEW.id, 'event_title', NEW.title, 'organizer_id', NEW.organizer_id)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for admin notification
DROP TRIGGER IF EXISTS event_approval_notification ON events;
CREATE TRIGGER event_approval_notification
AFTER INSERT ON events
FOR EACH ROW EXECUTE FUNCTION notify_admin_event_approval();

-- Function to notify user when event is approved/rejected
CREATE OR REPLACE FUNCTION notify_user_event_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending_approval' AND NEW.status = 'approved' THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.organizer_id,
      'event_updated',
      'Event Approved',
      'Your event "' || NEW.title || '" has been approved and is now live!',
      '/events/' || NEW.id,
      jsonb_build_object('event_id', NEW.id, 'status', 'approved')
    );
  ELSIF OLD.status = 'pending_approval' AND NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.organizer_id,
      'event_cancelled',
      'Event Rejected',
      'Your event "' || NEW.title || '" was not approved. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided'),
      '/dashboard',
      jsonb_build_object('event_id', NEW.id, 'status', 'rejected', 'reason', NEW.rejection_reason)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user notification on status change
DROP TRIGGER IF EXISTS event_status_notification ON events;
CREATE TRIGGER event_status_notification
AFTER UPDATE OF status ON events
FOR EACH ROW EXECUTE FUNCTION notify_user_event_status();

-- Insert sample event categories reference (for UI use)
INSERT INTO events (title, description, date, time, location, is_virtual, organizer_id, category, status, requires_approval, is_free)
SELECT 
  'Annual Alumni Gala 2024',
  'Join us for an evening of celebration, networking, and giving back to the community.',
  '2024-12-15',
  '18:00',
  'Serena Hotel, Nairobi',
  false,
  (SELECT id FROM profiles LIMIT 1),
  'networking',
  'approved',
  false,
  false
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO events (title, description, date, time, location, is_virtual, google_meet_link, organizer_id, category, status, requires_approval, is_free)
SELECT 
  'Tech Career Workshop',
  'Learn about emerging trends in technology from industry leaders.',
  '2024-12-05',
  '14:00',
  'Virtual Event',
  true,
  'https://meet.google.com/abc-defg-hij',
  (SELECT id FROM profiles LIMIT 1),
  'workshop',
  'approved',
  false,
  true
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO events (title, description, date, time, location, is_virtual, organizer_id, category, status, requires_approval, is_free)
SELECT 
  'Class of 2010 Reunion',
  'Reconnect with your classmates after 14 years!',
  '2024-12-20',
  '16:00',
  'Light Academy Campus',
  false,
  (SELECT id FROM profiles LIMIT 1),
  'reunion',
  'pending_approval',
  true,
  true
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
ON CONFLICT DO NOTHING;
