-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  graduation_year INTEGER,
  campus TEXT,
  job_title TEXT,
  company TEXT,
  bio TEXT,
  location TEXT,
  country TEXT,
  city TEXT,
  linkedin TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'silver', 'gold', 'platinum')),
  membership_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'product_approved', 'product_rejected', 'product_sold', 'product_purchased',
    'service_approved', 'service_rejected', 'service_purchased',
    'property_approved', 'property_rejected', 'property_sold',
    'payout_completed', 'payout_failed',
    'request_response', 'request_resolved',
    'event_reminder', 'event_cancelled', 'event_updated',
    'new_submission', 'admin_action_required',
    'meet_invitation', 'meet_reminder', 'meet_cancelled',
    'general'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table with Google Meet integration
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  google_meet_link TEXT,
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  organizer_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('networking', 'professional', 'social', 'educational', 'other')),
  max_attendees INTEGER,
  registered_count INTEGER DEFAULT 0,
  image_url TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  requires_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('pending', 'registered', 'cancelled', 'attended')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create groups table for user-created communities
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  category TEXT CHECK (category IN ('professional', 'interest', 'regional', 'batch', 'other')),
  privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  requires_approval BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 1,
  max_members INTEGER,
  image_url TEXT,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active', 'inactive', 'suspended')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group meetings table
CREATE TABLE IF NOT EXISTS group_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  google_meet_link TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT WITH CHECK (TRUE);

-- RLS Policies for events
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT USING (status IN ('upcoming', 'ongoing'));

CREATE POLICY "Admins can view all events"
  ON events FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can create events"
  ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can update their events"
  ON events FOR UPDATE USING (auth.uid() = organizer_id);

-- RLS Policies for groups
CREATE POLICY "Anyone can view active public groups"
  ON groups FOR SELECT USING (status = 'active' AND privacy = 'public');

CREATE POLICY "Group members can view their groups"
  ON groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification when product is approved/rejected
CREATE OR REPLACE FUNCTION notify_product_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending_approval' THEN
    PERFORM create_notification(
      NEW.seller_id,
      CASE WHEN NEW.product_type = 'service' THEN 'service_approved' ELSE 'product_approved' END,
      CASE WHEN NEW.product_type = 'service' THEN 'Service Approved!' ELSE 'Product Approved!' END,
      'Your ' || CASE WHEN NEW.product_type = 'service' THEN 'service' ELSE 'product' END || ' "' || NEW.title || '" has been approved and is now live on the marketplace.',
      '/marketplace',
      jsonb_build_object('product_id', NEW.id, 'product_title', NEW.title)
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending_approval' THEN
    PERFORM create_notification(
      NEW.seller_id,
      CASE WHEN NEW.product_type = 'service' THEN 'service_rejected' ELSE 'product_rejected' END,
      CASE WHEN NEW.product_type = 'service' THEN 'Service Not Approved' ELSE 'Product Not Approved' END,
      'Your ' || CASE WHEN NEW.product_type = 'service' THEN 'service' ELSE 'product' END || ' "' || NEW.title || '" was not approved. ' || COALESCE(NEW.rejection_reason, 'Please review and resubmit.'),
      '/marketplace',
      jsonb_build_object('product_id', NEW.id, 'product_title', NEW.title)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER product_status_change_notification
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_product_status_change();

-- Trigger to notify admin when product is submitted
CREATE OR REPLACE FUNCTION notify_admin_new_submission()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  IF NEW.status = 'pending_approval' THEN
    -- Notify all admins
    FOR admin_record IN 
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
    LOOP
      PERFORM create_notification(
        admin_record.user_id,
        'new_submission',
        'New ' || CASE WHEN NEW.product_type = 'service' THEN 'Service' ELSE 'Product' END || ' Submission',
        'A new ' || CASE WHEN NEW.product_type = 'service' THEN 'service' ELSE 'product' END || ' "' || NEW.title || '" is awaiting approval.',
        '/admin/approvals',
        jsonb_build_object('product_id', NEW.id, 'product_title', NEW.title, 'seller_id', NEW.seller_id)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER product_submission_admin_notification
  AFTER INSERT ON products
  FOR EACH ROW
  WHEN (NEW.status = 'pending_approval')
  EXECUTE FUNCTION notify_admin_new_submission();
