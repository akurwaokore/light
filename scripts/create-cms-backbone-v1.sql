-- CMS Tables
CREATE TABLE IF NOT EXISTS cms_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_name TEXT UNIQUE NOT NULL,
    section_title TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Content for Landing Page
INSERT INTO cms_sections (section_name, section_title, content)
VALUES 
('hero', 'Hero Section', '{
    "headline": "Connecting Light Academy Alumni Worldwide",
    "subheadline": "Join the premier network of Light Academy graduates. Foster professional growth, rediscover old friendships, and give back to your community.",
    "cta_primary": "Join the Community",
    "cta_secondary": "Explore Events",
    "hero_image": "/african-tech-startup-founders-team-nairobi.jpg"
}'::jsonb),
('features', 'Features Section', '{
    "title": "Why Join Light Alumni Connect?",
    "items": [
        {"title": "Professional Networking", "description": "Connect with industry leaders and fellow professionals across various sectors."},
        {"title": "Exclusive Events", "description": "Access reunions, webinars, and regional mixers tailored for our community."},
        {"title": "Giving Back", "description": "Support the next generation through mentorship and scholarship programs."}
    ]
}'::jsonb)
ON CONFLICT (section_name) DO NOTHING;

-- RLS for CMS
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active cms sections" ON cms_sections;
CREATE POLICY "Public can view active cms sections" ON cms_sections
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage cms sections" ON cms_sections;
CREATE POLICY "Admins can manage cms sections" ON cms_sections
    FOR ALL USING (public.is_admin());
