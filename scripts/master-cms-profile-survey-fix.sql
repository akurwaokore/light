-- Master CMS, Profile, and Survey Fix Script
-- Run this in your Supabase SQL editor

-- 1. Create CMS Tables if they don't exist
CREATE TABLE IF NOT EXISTS cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_description text,
  published boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS cms_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  section_name text,
  section_order integer DEFAULT 0,
  content jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 2. Create Survey/Questionnaire Tables
CREATE TABLE IF NOT EXISTS questionnaires (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    status text DEFAULT 'draft',
    target_audience text DEFAULT 'all',
    start_date timestamp,
    end_date timestamp,
    is_required boolean DEFAULT false,
    send_notification boolean DEFAULT true,
    created_by uuid REFERENCES profiles(id),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL, -- single_choice, multiple_choice, text, scale, yes_no
    options jsonb DEFAULT '[]',
    is_required boolean DEFAULT false,
    order_index integer DEFAULT 0,
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id),
    responses jsonb NOT NULL, -- { question_id: answer }
    completed_at timestamp DEFAULT now()
);

-- 3. Ensure columns exist and index
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_sections' AND column_name='section_name') THEN
    ALTER TABLE cms_sections ADD COLUMN section_name text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_sections_name ON cms_sections(section_name);

-- 4. Enable RLS and Setup Policies
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- CMS Policies
DROP POLICY IF EXISTS "admin_manage_cms_pages" ON cms_pages;
CREATE POLICY "admin_manage_cms_pages" ON cms_pages FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "cms_pages_public_read" ON cms_pages;
CREATE POLICY "cms_pages_public_read" ON cms_pages FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "admin_manage_cms_sections" ON cms_sections;
CREATE POLICY "admin_manage_cms_sections" ON cms_sections FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Survey Policies
DROP POLICY IF EXISTS "admin_manage_surveys" ON questionnaires;
CREATE POLICY "admin_manage_surveys" ON questionnaires FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "anyone_view_surveys" ON questionnaires;
CREATE POLICY "anyone_view_surveys" ON questionnaires FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_questions" ON survey_questions;
CREATE POLICY "admin_manage_questions" ON survey_questions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "anyone_view_questions" ON survey_questions;
CREATE POLICY "anyone_view_questions" ON survey_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_submit_responses" ON survey_responses;
CREATE POLICY "users_submit_responses" ON survey_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "admin_view_responses" ON survey_responses;
CREATE POLICY "admin_view_responses" ON survey_responses FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 5. Ensure Landing Page exists
INSERT INTO cms_pages (slug, title, meta_description, published)
VALUES ('landing', 'Light Alumni Connect Landing Page', 'Connect with fellow alumni from Light Group of Schools', true)
ON CONFLICT (slug) DO NOTHING;

-- 6. Fix Profile Table and Policies
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS graduation_year integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS campus text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_to_work boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_hiring boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
