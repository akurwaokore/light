-- PIPELINE TEST SCRIPT (IDEMPOTENT & CONSTRAINT-AWARE): Accounts, Jobs, Products, Services, Events, and Notifications

DO $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'edamoke@gmail.com';
    tester1_id UUID;
    tester1_email TEXT := 'tester1@example.com';
    tester2_id UUID;
    tester2_email TEXT := 'tester2@example.com';
BEGIN
    -- 1. IDENTIFY OR CREATE USERS
    -- Get existing Admin
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    -- Handle Tester 1
    tester1_id := '11111111-1111-1111-1111-111111111111';
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = tester1_id) THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES (tester1_id, tester1_email, crypt('Password123', gen_salt('bf')), now(), '{"display_name":"Tester One"}');
    END IF;
    
    INSERT INTO public.profiles (id, email, display_name, membership_tier, status, is_admin)
    VALUES (tester1_id, tester1_email, 'Tester One', 'platinum', 'active', false)
    ON CONFLICT (id) DO UPDATE SET membership_tier = EXCLUDED.membership_tier;

    -- Handle Tester 2
    tester2_id := '22222222-2222-2222-2222-222222222222';
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = tester2_id) THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES (tester2_id, tester2_email, crypt('Password123', gen_salt('bf')), now(), '{"display_name":"Tester Two"}');
    END IF;
    
    INSERT INTO public.profiles (id, email, display_name, membership_tier, status, is_admin, open_to_work, preferred_job_types)
    VALUES (tester2_id, tester2_email, 'Tester Two', 'gold', 'active', false, true, ARRAY['full-time'])
    ON CONFLICT (id) DO UPDATE SET membership_tier = EXCLUDED.membership_tier;

    -- 2. CLEAR EXISTING TEST DATA
    DELETE FROM public.jobs WHERE posted_by IN (admin_id, tester1_id, tester2_id);
    DELETE FROM public.products WHERE seller_id IN (admin_id, tester1_id, tester2_id);
    DELETE FROM public.events WHERE organizer_id IN (admin_id, tester1_id, tester2_id);

    -- 3. ADMIN POSTINGS
    INSERT INTO public.jobs (posted_by, title, company, description, location, employment_type, experience_level, status)
    VALUES 
    (admin_id, 'Official Senior Developer', 'Light Alumni Association', 'Core platform maintenance', 'Nairobi', 'full-time', 'senior', 'active'),
    (admin_id, 'Content Moderator', 'Light Alumni Association', 'Community oversight', 'Remote', 'part-time', 'entry', 'active');

    INSERT INTO public.products (seller_id, seller_name, seller_email, title, description, price, product_type, status)
    VALUES 
    (admin_id, 'Admin', admin_email, 'Official Alumni Hoodie', 'Premium cotton', 2500, 'product', 'approved'),
    (admin_id, 'Admin', admin_email, 'Alumni Networking Pass', 'Annual events access', 5000, 'service', 'approved');

    INSERT INTO public.events (organizer_id, organizer_name, title, description, date, time, status)
    VALUES 
    (admin_id, 'Admin', 'Grand Alumni Gala', 'Formal celebration dinner', now() + interval '30 days', '18:00', 'upcoming'),
    (admin_id, 'Admin', 'Career Workshop 2025', 'Professional skills training', now() + interval '15 days', '10:00', 'upcoming');


    -- 4. TESTER 1 POSTINGS
    INSERT INTO public.jobs (posted_by, title, company, description, location, employment_type, experience_level, status)
    VALUES 
    (tester1_id, 'React Developer', 'TesterOne Tech', 'Build cool stuff', 'Nairobi', 'full-time', 'mid', 'active'),
    (tester1_id, 'UI Designer', 'TesterOne Tech', 'Design cool stuff', 'Remote', 'contract', 'mid', 'active');

    INSERT INTO public.products (seller_id, seller_name, seller_email, title, description, price, product_type, status)
    VALUES 
    (tester1_id, 'Tester One', tester1_email, 'MacBook Air M2', 'Slightly used', 120000, 'product', 'approved'),
    (tester1_id, 'Tester One', tester1_email, 'Business Consulting', 'Grow your startup', 15000, 'service', 'approved');

    INSERT INTO public.events (organizer_id, organizer_name, title, description, date, time, status)
    VALUES (tester1_id, 'Tester One', 'Tech Coffee Meetup', 'Morning networking', now() + interval '5 days', '08:00', 'upcoming');


    -- 5. TESTER 2 POSTINGS
    INSERT INTO public.jobs (posted_by, title, company, description, location, employment_type, experience_level, status)
    VALUES 
    (tester2_id, 'Backend Engineer', 'T2 Solutions', 'Scale our systems', 'Mombasa', 'full-time', 'senior', 'active'),
    (tester2_id, 'DevOps Lead', 'T2 Solutions', 'Automate all things', 'Nairobi', 'full-time', 'senior', 'active');

    INSERT INTO public.products (seller_id, seller_name, seller_email, title, description, price, product_type, status)
    VALUES 
    (tester2_id, 'Tester Two', tester2_email, 'Office Chair', 'Ergonomic design', 8000, 'product', 'approved'),
    (tester2_id, 'Tester Two', tester2_email, 'Personal Training', 'Fitness coaching', 2000, 'service', 'approved');

    INSERT INTO public.events (organizer_id, organizer_name, title, description, date, time, status)
    VALUES (tester2_id, 'Tester Two', 'Mombasa Beach BBQ', 'Social gathering', now() + interval '20 days', '14:00', 'upcoming');


    -- 6. SIMULATE PURCHASE & NOTIFICATION
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
        tester1_id, 
        'general', 
        'New Service Order!', 
        'Admin has placed an order for your Business Consulting service.', 
        '/profile/listings'
    );

    RAISE NOTICE 'Pipeline population complete. All data created or refreshed with required fields.';
END $$;
