-- Update notifications type constraint to include social features
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
