-- Insert demo profiles (alumni)
INSERT INTO profiles (id, email, display_name, photo_url, campus, graduation_year, job_title, company, location, city, country, is_admin) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'sarah@example.com', 'Sarah Kimani', '/african-woman-professional.jpg', 'Light Academy Nairobi', 2012, 'Product Manager', 'Google', 'San Francisco', 'San Francisco', 'USA', false),
('550e8400-e29b-41d4-a716-446655440002', 'david@example.com', 'David Ochieng', '/african-male-professional-headshot.jpg', 'Light Academy Mombasa', 2010, 'CEO', 'Ochieng Enterprises', 'Nairobi', 'Nairobi', 'Kenya', false),
('550e8400-e29b-41d4-a716-446655440003', 'grace@example.com', 'Grace Wanjiku', '/african-woman-professional.jpg', 'Light Academy Nairobi', 2005, 'Senior Partner', 'Wanjiku Law Firm', 'Nairobi', 'Nairobi', 'Kenya', false),
('550e8400-e29b-41d4-a716-446655440004', 'james@example.com', 'James Mutua', '/african-man-graduate-professional.jpg', 'Light Academy Nairobi', 2023, 'Student', 'Light Academy', 'Nairobi', 'Nairobi', 'Kenya', false),
('550e8400-e29b-41d4-a716-446655440005', 'peter@example.com', 'Peter Njoroge', '/african-male-professional-developer.jpg', 'Light Academy Nairobi', 2008, 'CTO', 'Tech Solutions Ltd', 'London', 'London', 'UK', false),
('550e8400-e29b-41d4-a716-446655440006', 'mary@example.com', 'Mary Akinyi', '/african-woman-professional.jpg', 'Light Academy Nairobi', 2009, 'Marketing Director', 'KCB Bank', 'Nairobi', 'Nairobi', 'Kenya', false);

-- Insert demo posts
INSERT INTO posts (id, author_id, content, image_url, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Excited to announce that I''ve just been promoted to Senior Software Engineer! Grateful for the education from Light Academy. 🎉', '/african-software-engineer-celebrating-promotion.jpg', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Had an amazing time at the alumni networking event last weekend. Met so many inspiring people!', '/professional-networking-event-kenya-nairobi.jpg', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Throwback to our graduation day! Can''t believe it''s been 5 years already. 🎓', '/kenyan-university-graduation-ceremony-students-cel.jpg', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'Just launched my startup building AI solutions for African businesses! Link in bio 🚀', '/african-tech-startup-founders-team-nairobi.jpg', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Insert demo events
INSERT INTO events (id, title, description, start_date, end_date, location, venue_address, is_virtual, event_type, max_attendees, image_url, status, organizer_id, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Annual Alumni Gala 2025', 'Join us for an evening of networking and celebration', '2025-03-15T18:00:00Z', '2025-03-15T22:00:00Z', 'Nairobi Serena Hotel', 'Kenyatta Avenue, Nairobi', false, 'networking', 200, '/elegant-gala-dinner-event-in-nairobi-kenya.jpg', 'approved', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'Tech Career Workshop', 'Learn about the latest trends in technology careers', '2025-02-20T14:00:00Z', '2025-02-20T17:00:00Z', 'Virtual Event', NULL, true, 'workshop', 100, '/technology-workshop-presentation.jpg', 'approved', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'Sports Day - Football Tournament', 'Inter-batch football tournament championship', '2025-03-01T09:00:00Z', '2025-03-01T17:00:00Z', 'Moi Sports Centre Kasarani', 'Thika Road, Nairobi', false, 'sports', 300, '/football-tournament-kenya.jpg', 'approved', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW());

-- Insert demo jobs
INSERT INTO jobs (id, title, company, description, requirements, responsibilities, location, employment_type, experience_level, salary_min, salary_max, skills, application_deadline, is_remote, status, posted_by, created_at, updated_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Senior Software Engineer', 'Safaricom PLC', 'We are seeking an experienced Senior Software Engineer', '5+ years experience, Strong Java/Kotlin skills', 'Lead development of mobile banking features', 'Nairobi, Kenya', 'full-time', 'senior', 150000, 250000, ARRAY['Java', 'Kotlin', 'AWS', 'Microservices'], '2025-03-31', false, 'active', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440002', 'Marketing Manager', 'Kenya Commercial Bank', 'Lead our digital marketing initiatives', '3+ years experience, Digital marketing expertise', 'Develop marketing strategies, Manage campaigns', 'Nairobi, Kenya', 'full-time', 'mid', 100000, 180000, ARRAY['Digital Marketing', 'Brand Strategy', 'Analytics'], '2025-03-15', false, 'active', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440003', 'Data Analyst', 'Equity Bank', 'Join our analytics team for data-driven decision making', 'Strong SQL and Python skills', 'Create dashboards, Analyze customer data', 'Remote', 'full-time', 'mid', 80000, 120000, ARRAY['SQL', 'Python', 'Tableau', 'Statistics'], '2025-04-30', true, 'active', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW());

-- Insert demo clubs
INSERT INTO clubs (id, name, description, category, created_by, created_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'Tech Innovators', 'For alumni in technology and software development', 'professional', '550e8400-e29b-41d4-a716-446655440001', NOW()),
('990e8400-e29b-41d4-a716-446655440002', 'Healthcare Heroes', 'Doctors, nurses, and healthcare professionals', 'professional', '550e8400-e29b-41d4-a716-446655440002', NOW()),
('990e8400-e29b-41d4-a716-446655440003', 'Entrepreneurs Circle', 'Business owners and startup founders', 'professional', '550e8400-e29b-41d4-a716-446655440003', NOW()),
('990e8400-e29b-41d4-a716-446655440004', 'Book Club', 'Monthly reads and literary discussions', 'interest', '550e8400-e29b-41d4-a716-446655440004', NOW());

-- Insert demo campaigns
INSERT INTO campaigns (id, title, description, goal, raised, end_date, status, created_by, image_url, created_at) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 'New Library Building Fund', 'Help us build a state-of-the-art library for current students', 5000000, 3250000, '2025-03-31', 'active', '550e8400-e29b-41d4-a716-446655440001', '/modern-library-building-in-kenyan-school.jpg', NOW()),
('aa0e8400-e29b-41d4-a716-446655440002', 'Scholarship Fund 2024', 'Support deserving students who cannot afford school fees', 2000000, 1750000, '2024-12-31', 'active', '550e8400-e29b-41d4-a716-446655440002', '/happy-african-students-in-classroom-kenya.jpg', NOW()),
('aa0e8400-e29b-41d4-a716-446655440003', 'Sports Equipment Drive', 'Upgrade sports facilities and equipment for student athletes', 1500000, 450000, '2025-06-30', 'active', '550e8400-e29b-41d4-a716-446655440003', '/school-sports-equipment-football-basketball.jpg', NOW());

-- Insert demo products
INSERT INTO products (id, title, description, price, seller_id, category, status, images, created_at, updated_at) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'MacBook Pro 2022', 'Used for 1 year, comes with original charger and box', 150000, '550e8400-e29b-41d4-a716-446655440005', 'Electronics', 'approved', ARRAY['/iphone-14-pro-space-black-smartphone.jpg'], NOW(), NOW()),
('bb0e8400-e29b-41d4-a716-446655440002', 'Professional Photography Services', 'Events, portraits, and corporate photography', 25000, '550e8400-e29b-41d4-a716-446655440006', 'Services', 'approved', ARRAY['/canon-eos-r6-mirrorless-camera.jpg'], NOW(), NOW()),
('bb0e8400-e29b-41d4-a716-446655440003', 'iPhone 14 Pro - 256GB', 'Space Black, excellent condition, minimal use', 95000, '550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'approved', ARRAY['/iphone-14-pro-space-black-smartphone.jpg'], NOW(), NOW());

-- Insert demo perks
INSERT INTO perks (id, business, description, discount, category, logo_url, status, owner_id, created_at) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 'Pop Network Africa', 'Precision and relevance marketing services', '25% off all marketing packages', 'Marketing', '/pop-network-logo.jpg', 'verified', '550e8400-e29b-41d4-a716-446655440001', NOW()),
('cc0e8400-e29b-41d4-a716-446655440002', 'Kamau''s Auto Service', 'Complete car servicing and repairs', '15% off all services', 'Automotive', '/auto-repair-logo.jpg', 'verified', '550e8400-e29b-41d4-a716-446655440002', NOW()),
('cc0e8400-e29b-41d4-a716-446655440003', 'Wanjiku Law Firm', 'Legal services for individuals and businesses', 'Free initial consultation', 'Legal', '/law-firm-logo.jpg', 'verified', '550e8400-e29b-41d4-a716-446655440003', NOW()),
('cc0e8400-e29b-41d4-a716-446655440004', 'TechHub Coworking', 'Modern coworking spaces in Nairobi', 'First month free', 'Business Services', '/coworking-space-logo.jpg', 'verified', '550e8400-e29b-41d4-a716-446655440005', NOW());
