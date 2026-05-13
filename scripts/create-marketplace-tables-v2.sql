-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  product_type VARCHAR(20) DEFAULT 'product' CHECK (product_type IN ('product', 'service')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Update products table structure
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'product' CHECK (product_type IN ('product', 'service'));

-- Insert default categories
INSERT INTO product_categories (name, description, product_type) VALUES
  ('Electronics', 'Computers, phones, gadgets, and electronic devices', 'product'),
  ('Fashion', 'Clothing, accessories, and fashion items', 'product'),
  ('Vehicles', 'Cars, motorcycles, and other vehicles', 'product'),
  ('Real Estate', 'Properties for sale or rent', 'product'),
  ('Books & Media', 'Books, movies, music, and educational materials', 'product'),
  ('Home & Garden', 'Furniture, decor, and garden supplies', 'product'),
  ('Services', 'Professional services offered by alumni', 'service'),
  ('Consulting', 'Business and professional consulting services', 'service'),
  ('Creative', 'Design, photography, and creative services', 'service'),
  ('Education', 'Tutoring, training, and educational services', 'service'),
  ('Other', 'Other products and services', 'both')
ON CONFLICT DO NOTHING;

-- Create storage bucket for marketplace images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketplace');

CREATE POLICY "Public can view marketplace images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace');

CREATE POLICY "Users can update their own marketplace images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own marketplace images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1]);
