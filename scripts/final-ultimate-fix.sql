-- Final Social & Marketplace Master Fix Script
-- Run this in your Supabase SQL editor

-- 1. Create Social Feed Tables
CREATE TABLE IF NOT EXISTS posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type text DEFAULT 'like',
    created_at timestamp DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT now()
);

-- 2. Create Marketplace Table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    price numeric NOT NULL,
    currency text DEFAULT 'KES',
    category text,
    images jsonb DEFAULT '[]',
    product_type text DEFAULT 'product', -- 'product' or 'service'
    status text DEFAULT 'approved', -- Set to approved for now to show immediately
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 3. Enable RLS and Setup Policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Post Policies
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Reaction Policies
DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
CREATE POLICY "Anyone can view reactions" ON post_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can react to posts" ON post_reactions;
CREATE POLICY "Users can react to posts" ON post_reactions FOR ALL USING (auth.uid() = user_id);

-- Marketplace Policies
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create products" ON products;
CREATE POLICY "Users can create products" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- 4. CMS & Profile Baseline Fixes (Include previous fixes to be safe)
CREATE TABLE IF NOT EXISTS cms_pages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL, title text NOT NULL, meta_description text, published boolean DEFAULT false, created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS cms_sections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), page_id uuid NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE, section_type text NOT NULL, section_name text, section_order integer DEFAULT 0, content jsonb, created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now());
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS campus text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
