-- CMS Content Management System Tables

-- Table to store page configurations
CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT,
  meta_keywords TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Table to store page sections
CREATE TABLE IF NOT EXISTS cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES cms_pages(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  section_name TEXT NOT NULL,
  section_order INTEGER NOT NULL,
  content JSONB,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store assets/media
CREATE TABLE IF NOT EXISTS cms_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size INTEGER,
  dimensions JSONB,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id)
);

-- Table to store theme/branding
CREATE TABLE IF NOT EXISTS cms_theme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_key TEXT NOT NULL UNIQUE,
  theme_value TEXT,
  value_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store navigation menus
CREATE TABLE IF NOT EXISTS cms_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_name TEXT NOT NULL UNIQUE,
  menu_items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_theme ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_menus ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CMS (Admin only)
CREATE POLICY "admins_can_manage_pages" ON cms_pages
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "anyone_can_view_published_pages" ON cms_pages
  FOR SELECT USING (is_published = true OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "admins_can_manage_sections" ON cms_sections
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "anyone_can_view_sections" ON cms_sections
  FOR SELECT USING (true);

CREATE POLICY "admins_can_manage_assets" ON cms_assets
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "anyone_can_view_assets" ON cms_assets
  FOR SELECT USING (true);

CREATE POLICY "admins_can_manage_theme" ON cms_theme
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "anyone_can_view_theme" ON cms_theme
  FOR SELECT USING (true);

CREATE POLICY "admins_can_manage_menus" ON cms_menus
  FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "anyone_can_view_menus" ON cms_menus
  FOR SELECT USING (true);
