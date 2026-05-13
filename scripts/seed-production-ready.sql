-- Master Seeding Script for Light Alumni Connect

-- 1. Create Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cv_url TEXT NOT NULL,
    cover_letter TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on job_applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own applications" ON job_applications;
CREATE POLICY "Users can view their own applications" ON job_applications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all applications" ON job_applications;
CREATE POLICY "Admins can view all applications" ON job_applications
    FOR ALL USING (public.is_admin());

-- 2. Seed Jobs
INSERT INTO jobs (title, company, location, salary_range, description, posted_by_name, status)
VALUES 
('Senior Full Stack Developer', 'TechNova Solutions', 'Nairobi, Kenya (Remote)', 'KES 250,000 - 400,000', 'Looking for an experienced developer to lead our fintech product development.', 'Admin', 'approved'),
('Marketing Manager', 'Green Horizons Ltd', 'Mombasa, Kenya', 'KES 150,000 - 200,000', 'Seeking a creative marketing leader to drive our sustainability campaigns.', 'Admin', 'approved'),
('Data Analyst', 'Global Insights Group', 'Nairobi, Kenya', 'KES 120,000 - 180,000', 'Analyze complex datasets to provide actionable business intelligence.', 'Admin', 'approved')
ON CONFLICT DO NOTHING;

-- 3. Seed Marketplace Products
INSERT INTO marketplace_products (title, description, price, category, seller_name, seller_email, status)
VALUES 
('MacBook Pro M2 14"', 'Like new condition, 16GB RAM, 512GB SSD. Perfect for developers.', 185000, 'Electronics', 'James Mwangi', 'james@example.com', 'approved'),
('Office Desk - Ergonomic', 'High-quality standing desk, barely used.', 35000, 'Furniture', 'Sarah Njeri', 'sarah@example.com', 'approved'),
('Professional Photography Session', 'Exclusive discount for alumni. 2-hour session with 20 edited photos.', 15000, 'Services', 'David Omondi', 'david@example.com', 'approved')
ON CONFLICT DO NOTHING;

-- 4. Seed Clubs & Groups
INSERT INTO clubs (name, description, category, status, members_count)
VALUES 
('Entrepreneurs Hub', 'A dedicated space for alumni business owners to network and share resources.', 'Professional', 'active', 124),
('Tech Innovators', 'Discussing AI, Web3, and the future of technology in Africa.', 'Technology', 'active', 256),
('Light Academy Runners', 'Weekly jogging and fitness meetups for healthy living.', 'Social', 'active', 45)
ON CONFLICT (name) DO NOTHING;

-- 5. Seed Donation Campaigns
INSERT INTO donation_campaigns (title, description, target_amount, current_amount, status)
VALUES 
('School Science Lab Upgrade', 'Raising funds to provide state-of-the-art equipment for our junior scientists.', 1000000, 450000, 'active'),
('Alumni Scholarship Fund 2026', 'Supporting bright students from disadvantaged backgrounds with tuition fees.', 2500000, 1200000, 'active'),
('New Sports Complex', 'Phase 1 of the multi-purpose alumni sports facility.', 5000000, 800000, 'active')
ON CONFLICT DO NOTHING;

-- 6. Initialize Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
('avatars', 'avatars', true),
('marketplace', 'marketplace', true),
('cms', 'cms', true),
('documents', 'documents', false) -- Private for CVs
ON CONFLICT (id) DO NOTHING;

-- Standardize RLS for storage (Generic Policies)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'marketplace', 'cms'));
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('avatars', 'marketplace', 'cms', 'documents'));
CREATE POLICY "User Document Access" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
