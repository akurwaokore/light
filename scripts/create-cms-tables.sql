-- CMS Tables for managing landing page content

-- Main pages table
CREATE TABLE IF NOT EXISTS cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_description text,
  published boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Sections table for page content
CREATE TABLE IF NOT EXISTS cms_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  section_type text NOT NULL, -- 'hero', 'features', 'testimonials', 'stats', 'cta'
  section_order integer NOT NULL,
  content jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Hero section specific content
CREATE TABLE IF NOT EXISTS cms_hero_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  headline text NOT NULL,
  subheadline text,
  cta_text text DEFAULT 'Get Started',
  cta_url text DEFAULT '/dashboard',
  background_image_url text,
  text_color text DEFAULT '#ffffff',
  animation_enabled boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- CMS Images table
CREATE TABLE IF NOT EXISTS cms_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES cms_sections(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  caption text,
  display_order integer,
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_images ENABLE ROW LEVEL SECURITY;

-- CMS Policies - Admins can manage all CMS content
CREATE POLICY "admin_manage_cms_pages" ON cms_pages
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "cms_pages_public_read" ON cms_pages
  FOR SELECT USING (published = true);

CREATE POLICY "admin_manage_cms_sections" ON cms_sections
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "admin_manage_cms_hero" ON cms_hero_content
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "admin_manage_cms_images" ON cms_images
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Initialize landing page entry
INSERT INTO cms_pages (slug, title, meta_description, published)
VALUES ('landing', 'Light Alumni Connect Landing Page', 'Connect with fellow alumni from Light Group of Schools', true)
ON CONFLICT (slug) DO NOTHING;
