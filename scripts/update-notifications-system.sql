-- Add job preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_job_categories UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_job_types TEXT[] DEFAULT '{}';

-- 1. Trigger for Marketplace Notifications
CREATE OR REPLACE FUNCTION notify_all_new_marketplace_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify all active alumni about the new listing
    -- Excluding the seller themselves
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    SELECT 
        id, 
        'general', 
        'New in Marketplace: ' || NEW.title,
        'A new ' || NEW.product_type || ' has been listed by ' || NEW.seller_name,
        '/marketplace',
        jsonb_build_object('product_id', NEW.id, 'product_title', NEW.title)
    FROM profiles
    WHERE id != NEW.seller_id AND status = 'active';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_marketplace ON products;
CREATE TRIGGER tr_notify_marketplace
AFTER INSERT ON products
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION notify_all_new_marketplace_item();

-- 2. Trigger for Job Match Notifications
CREATE OR REPLACE FUNCTION notify_matching_jobs()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify users whose preferences match the new job's category or type
    -- and who are "Open to Work"
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    SELECT 
        id, 
        'general', 
        'Job Match Found: ' || NEW.title,
        'A new ' || NEW.employment_type || ' opening at ' || NEW.company || ' matches your profile.',
        '/careers',
        jsonb_build_object('job_id', NEW.id, 'job_title', NEW.title)
    FROM profiles
    WHERE id != NEW.posted_by 
    AND status = 'active'
    AND open_to_work = true
    AND (
        NEW.category_id = ANY(preferred_job_categories)
        OR 
        NEW.employment_type = ANY(preferred_job_types)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_job_match ON jobs;
CREATE TRIGGER tr_notify_job_match
AFTER INSERT ON jobs
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION notify_matching_jobs();

-- 3. Trigger for Friend Requests
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
DECLARE
    requester_name TEXT;
BEGIN
    SELECT display_name INTO requester_name FROM profiles WHERE id = NEW.user_id;
    
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
        NEW.friend_id, 
        'general', 
        'New Connection Request', 
        requester_name || ' wants to connect with you.', 
        '/friends',
        jsonb_build_object('requester_id', NEW.user_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_friend_request ON friendships;
CREATE TRIGGER tr_notify_friend_request
AFTER INSERT ON friendships
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_friend_request();

-- 4. Trigger for Friendship Acceptance
CREATE OR REPLACE FUNCTION notify_friendship_accepted()
RETURNS TRIGGER AS $$
DECLARE
    recip_name TEXT;
BEGIN
    SELECT display_name INTO recip_name FROM profiles WHERE id = NEW.friend_id;
    
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
        NEW.user_id, 
        'general', 
        'Connection Accepted!', 
        recip_name || ' accepted your connection request.', 
        '/friends',
        jsonb_build_object('friend_id', NEW.friend_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_friendship_accepted ON friendships;
CREATE TRIGGER tr_notify_friendship_accepted
AFTER UPDATE ON friendships
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
EXECUTE FUNCTION notify_friendship_accepted();
