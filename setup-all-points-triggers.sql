-- Script to setup comprehensive triggers for the loyalty points system

-- Helper function (from registration script) to ensure it exists
CREATE OR REPLACE FUNCTION award_points(target_user_id UUID, points_to_add INTEGER, action_name TEXT, action_desc TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_points (user_id, total_points)
    VALUES (target_user_id, points_to_add)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_points = user_points.total_points + points_to_add,
        updated_at = now();

    INSERT INTO public.point_transactions (user_id, amount, action_type, description)
    VALUES (target_user_id, points_to_add, action_name, action_desc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Trigger for Posting a Job (25 points)
CREATE OR REPLACE FUNCTION trigger_award_job_post_points()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM award_points(NEW.posted_by, 25, 'job_posted', 'Awarded for posting a new job opportunity');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_job_created_award_points ON public.jobs;
CREATE TRIGGER on_job_created_award_points
    AFTER INSERT ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_award_job_post_points();


-- 2. Trigger for Posting a Marketplace Item (Service or Product) (15 points)
CREATE OR REPLACE FUNCTION trigger_award_marketplace_post_points()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM award_points(NEW.seller_id, 15, 'marketplace_posted', 'Awarded for listing a product or service');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_created_award_points ON public.marketplace_products;
CREATE TRIGGER on_product_created_award_points
    AFTER INSERT ON public.marketplace_products
    FOR EACH ROW
    EXECUTE FUNCTION trigger_award_marketplace_post_points();


-- 3. Trigger for Purchasing a Marketplace Item (10 points)
-- Assumes a 'marketplace_purchases' or similar table exists. If the structure is different, this needs adaptation.
-- Common structures use 'buyer_id' or 'user_id'
CREATE OR REPLACE FUNCTION trigger_award_purchase_points()
RETURNS TRIGGER AS $$
DECLARE
    buyer_uuid UUID;
BEGIN
    -- Try to find the buyer ID. Depending on schema, it might be buyer_id or user_id
    IF COL_LENGTH('public.marketplace_purchases', 'buyer_id') IS NOT NULL THEN
        EXECUTE 'SELECT $1.buyer_id' USING NEW INTO buyer_uuid;
    ELSIF COL_LENGTH('public.marketplace_purchases', 'user_id') IS NOT NULL THEN
        EXECUTE 'SELECT $1.user_id' USING NEW INTO buyer_uuid;
    END IF;

    IF buyer_uuid IS NOT NULL THEN
        PERFORM award_points(buyer_uuid, 10, 'marketplace_purchase', 'Awarded for supporting alumni businesses');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create the trigger if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketplace_purchases') THEN
        DROP TRIGGER IF EXISTS on_purchase_created_award_points ON public.marketplace_purchases;
        CREATE TRIGGER on_purchase_created_award_points
            AFTER INSERT ON public.marketplace_purchases
            FOR EACH ROW
            EXECUTE FUNCTION trigger_award_purchase_points();
    END IF;
END $$;
