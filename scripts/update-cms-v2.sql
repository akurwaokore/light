-- Global CMS Settings Table
CREATE TABLE IF NOT EXISTS cms_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE cms_settings ENABLE ROW LEVEL SECURITY;

-- CMS Settings Policies
CREATE POLICY "admin_manage_cms_settings" ON cms_settings
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "cms_settings_public_read" ON cms_settings
  FOR SELECT USING (true);

-- Insert Initial Logo Setting
INSERT INTO cms_settings (key, value)
VALUES ('logo', '{"url": "/light-alumni-logo.png", "alt": "Light Alumni Association"}')
ON CONFLICT (key) DO NOTHING;

-- Ensure Landing Page Sections Exist
INSERT INTO cms_sections (page_id, section_name, section_type, section_order, content)
SELECT id, 'hero', 'hero', 1, '{"badge": "Welcome to the future of alumni networking", "title": "Where Light Alumni Shine Together", "description": "Join the official alumni network of Light Group of Schools. Connect with fellow graduates, advance your career, and give back to the community that shaped you."}'
FROM cms_pages WHERE slug = 'landing'
ON CONFLICT DO NOTHING;

INSERT INTO cms_sections (page_id, section_name, section_type, section_order, content)
SELECT id, 'features', 'features', 2, '{"items": []}'
FROM cms_pages WHERE slug = 'landing'
ON CONFLICT DO NOTHING;

INSERT INTO cms_sections (page_id, section_name, section_type, section_order, content)
SELECT id, 'testimonials', 'testimonials', 3, '{"items": []}'
FROM cms_pages WHERE slug = 'landing'
ON CONFLICT DO NOTHING;
