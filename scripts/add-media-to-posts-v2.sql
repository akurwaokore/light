-- Add video and multi-image support to posts
DO $$ 
BEGIN
    -- Add video_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'video_url') THEN
        ALTER TABLE posts ADD COLUMN video_url TEXT;
    END IF;

    -- Add media_urls column (for multi-image/gallery)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'media_urls') THEN
        ALTER TABLE posts ADD COLUMN media_urls TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Update RLS for posts to be more robust
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
CREATE POLICY "Public posts are viewable by everyone" ON posts
    FOR SELECT USING (visibility = 'public' OR visibility IS NULL OR status = 'active' OR author_id = auth.uid());

-- Marketplace Fixes: Ensure status column exists and default to approved/active
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
        ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Fix marketplace RLS
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own products" ON products;
CREATE POLICY "Users can insert their own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update their own products" ON products;
CREATE POLICY "Users can update their own products" ON products
    FOR UPDATE USING (auth.uid() = seller_id);
