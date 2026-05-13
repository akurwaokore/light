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
