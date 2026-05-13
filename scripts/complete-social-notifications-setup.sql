-- ====================================================================
-- SOCIAL NOTIFICATIONS SCHEMA UPDATE
-- Run this in your Supabase SQL Editor
-- ====================================================================

-- 1. Update the notifications table type constraint
-- This allows the new notification types we've added to the API
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'product_approved', 'product_rejected', 'product_sold', 'product_purchased',
    'service_approved', 'service_rejected', 'service_purchased',
    'property_approved', 'property_rejected', 'property_sold',
    'payout_completed', 'payout_failed',
    'request_response', 'request_resolved',
    'event_reminder', 'event_cancelled', 'event_updated',
    'new_submission', 'admin_action_required',
    'meet_invitation', 'meet_reminder', 'meet_cancelled',
    'post_like', 'post_comment', 'comment_reply', 'friend_request', 'friend_accepted',
    'general'
));

-- 2. Ensure RLS policies are correct for notifications
-- (Already handled in previous scripts, but good for safety)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT WITH CHECK (true);

-- 3. Add comment updated_at trigger if not already present
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_updated_at ON comments;
CREATE TRIGGER trigger_update_comment_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();

-- 4. Verification queries (optional)
-- SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
