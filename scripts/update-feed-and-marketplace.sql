-- Update posts table: Ensure status column exists and set existing posts to active
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'status') THEN
        ALTER TABLE posts ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;

UPDATE posts SET status = 'active' WHERE status IS NULL;

-- Ensure visibility column exists and default to public
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'visibility') THEN
        ALTER TABLE posts ADD COLUMN visibility text DEFAULT 'public';
    END IF;
END $$;

UPDATE posts SET visibility = 'public' WHERE visibility IS NULL;

-- Update marketplace products table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
        ALTER TABLE products ADD COLUMN status text DEFAULT 'approved';
    END IF;
END $$;

UPDATE products SET status = 'approved' WHERE status IS NULL;

-- Add auto-approval settings to system_settings if they don't exist
INSERT INTO system_settings (key, value, posts_auto_approve, marketplace_auto_approve)
VALUES ('default', '{}', true, true)
ON CONFLICT (key) DO UPDATE 
SET posts_auto_approve = true, marketplace_auto_approve = true;

-- Ensure RLS policies are permissive enough for public posts
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
CREATE POLICY "Public posts are viewable by everyone" ON posts
    FOR SELECT USING (visibility = 'public' OR visibility IS NULL OR status = 'active');

-- Ensure RLS policies for products
DROP POLICY IF EXISTS "Approved products are viewable by everyone" ON products;
CREATE POLICY "Approved products are viewable by everyone" ON products
    FOR SELECT USING (status = 'approved' OR status = 'active' OR status IS NULL);
