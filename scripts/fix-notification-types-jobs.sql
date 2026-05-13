-- Fix notifications type check constraint to include job application types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'product_approved', 'product_rejected', 'product_sold', 'product_purchased',
    'new_submission', 'recommended_job', 'friend_request', 'friend_accepted',
    'new_message', 'new_comment', 'new_reaction', 'new_post', 'event_reminder',
    'event_registration', 'points_awarded', 'milestone_reached', 'system_alert',
    'general', 'job_application', 'application_submitted'
));
