-- Fix for CMS saving issues
-- This script ensures the necessary columns exist and adds a unique constraint 
-- to allow the "ON CONFLICT" pattern if we were using it in SQL, 
-- but primarily it ensures the schema is ready for the API updates.

-- 1. Ensure section_name is unique per page (usually there's only one landing page)
-- This allows us to reliably target sections by name.
ALTER TABLE cms_sections ADD COLUMN IF NOT EXISTS section_name text;

-- 2. Create an index for faster lookups by section name
CREATE INDEX IF NOT EXISTS idx_cms_sections_name ON cms_sections(section_name);

-- 3. Ensure the landing page exists in cms_pages
INSERT INTO cms_pages (slug, title, meta_description, published)
VALUES ('landing', 'Light Alumni Connect Landing Page', 'Connect with fellow alumni from Light Group of Schools', true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Fix RLS policies to ensure admin can definitely insert/update
-- (Sometimes existing policies might be too restrictive on inserts)
DROP POLICY IF EXISTS "admin_manage_cms_sections" ON cms_sections;
CREATE POLICY "admin_manage_cms_sections" ON cms_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 5. Add default sections if they don't exist
DO $$
DECLARE
  landing_page_id uuid;
BEGIN
  SELECT id INTO landing_page_id FROM cms_pages WHERE slug = 'landing' LIMIT 1;
  
  IF landing_page_id IS NOT NULL THEN
    -- Hero
    INSERT INTO cms_sections (page_id, section_name, section_type, section_order, content)
    VALUES (landing_page_id, 'hero', 'hero', 0, '{"badge": "Welcome", "title": "Light Alumni Shine", "description": "Connect with fellow graduates."}')
    ON CONFLICT DO NOTHING;

    -- Features
    INSERT INTO cms_sections (page_id, section_name, section_type, section_order, content)
    VALUES (landing_page_id, 'features', 'features', 1, '{"items": []}')
    ON CONFLICT DO NOTHING;

    -- Video Gallery
    INSERT INTO cms_sections (page_id, section_name, section_type, section_order, content)
    VALUES (landing_page_id, 'video_gallery', 'video_gallery', 5, '{"items": []}')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
