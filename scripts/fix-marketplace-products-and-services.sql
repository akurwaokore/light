-- Marketplace products/services compatibility fix for Supabase
-- Run this in Supabase SQL Editor.
-- Goal: make both product and service creation work reliably with current app code.

BEGIN;

-- Ensure the core table exists
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name TEXT,
  seller_email TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  category TEXT,
  product_type TEXT NOT NULL DEFAULT 'product',
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_approval',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add any missing columns used by different code paths / older migrations
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_email TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'product';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill safe defaults for existing rows
UPDATE public.products
SET
  currency = COALESCE(currency, 'KES'),
  product_type = COALESCE(NULLIF(product_type, ''), 'product'),
  status = COALESCE(NULLIF(status, ''), 'pending_approval'),
  image_urls = COALESCE(image_urls, CASE WHEN image_url IS NOT NULL THEN ARRAY[image_url] ELSE images END, '{}'),
  images = COALESCE(images, image_urls, CASE WHEN image_url IS NOT NULL THEN ARRAY[image_url] ELSE '{}'::TEXT[] END),
  updated_at = COALESCE(updated_at, now()),
  created_at = COALESCE(created_at, now())
WHERE
  currency IS NULL
  OR product_type IS NULL OR product_type = ''
  OR status IS NULL OR status = ''
  OR image_urls IS NULL
  OR images IS NULL
  OR updated_at IS NULL
  OR created_at IS NULL;

-- Relax NOT NULL problems commonly seen in mixed schemas, then enforce essentials only
ALTER TABLE public.products ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN price SET DEFAULT 0;
ALTER TABLE public.products ALTER COLUMN currency SET DEFAULT 'KES';
ALTER TABLE public.products ALTER COLUMN product_type SET DEFAULT 'product';
ALTER TABLE public.products ALTER COLUMN status SET DEFAULT 'pending_approval';
ALTER TABLE public.products ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.products ALTER COLUMN updated_at SET DEFAULT now();

-- Drop and recreate constraints safely
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN ('product', 'service'));

ALTER TABLE public.products
  ADD CONSTRAINT products_status_check
  CHECK (status IN ('draft', 'pending', 'pending_approval', 'approved', 'active', 'rejected', 'sold', 'expired', 'inactive'));

-- Helpful indexes
CREATE INDEX IF NOT EXISTS products_seller_id_idx ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS products_product_type_idx ON public.products (product_type);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products (created_at DESC);

-- Optional categories table used by some marketplace setups
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  product_type TEXT NOT NULL DEFAULT 'product',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Normalize existing rows before enforcing constraint
UPDATE public.product_categories
SET product_type = CASE
  WHEN product_type IN ('product', 'service') THEN product_type
  WHEN LOWER(COALESCE(name, '')) = 'services' THEN 'service'
  ELSE 'product'
END
WHERE product_type IS DISTINCT FROM CASE
  WHEN product_type IN ('product', 'service') THEN product_type
  WHEN LOWER(COALESCE(name, '')) = 'services' THEN 'service'
  ELSE 'product'
END;

ALTER TABLE public.product_categories DROP CONSTRAINT IF EXISTS product_categories_product_type_check;
ALTER TABLE public.product_categories
  ADD CONSTRAINT product_categories_product_type_check
  CHECK (product_type IN ('product', 'service'));

INSERT INTO public.product_categories (name, description, product_type)
VALUES
  ('Electronics', 'Computers, phones, gadgets, and devices', 'product'),
  ('Fashion', 'Clothing, shoes, accessories, and apparel', 'product'),
  ('Vehicles', 'Cars, bikes, and transport listings', 'product'),
  ('Real Estate', 'Property and accommodation listings', 'product'),
  ('Books & Media', 'Books, learning materials, and media', 'product'),
  ('Home & Garden', 'Home items, decor, and outdoor goods', 'product'),
  ('Services', 'Professional and freelance services', 'service'),
  ('Other', 'Other products or services', 'product')
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  product_type = EXCLUDED.product_type;

-- Keep image arrays in sync for old/new code paths
CREATE OR REPLACE FUNCTION public.sync_product_images()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.image_urls IS NULL AND NEW.images IS NOT NULL THEN
    NEW.image_urls := NEW.images;
  END IF;

  IF NEW.images IS NULL AND NEW.image_urls IS NOT NULL THEN
    NEW.images := NEW.image_urls;
  END IF;

  IF (NEW.image_urls IS NULL OR cardinality(NEW.image_urls) = 0) AND NEW.image_url IS NOT NULL THEN
    NEW.image_urls := ARRAY[NEW.image_url];
  END IF;

  IF (NEW.images IS NULL OR cardinality(NEW.images) = 0) AND NEW.image_url IS NOT NULL THEN
    NEW.images := ARRAY[NEW.image_url];
  END IF;

  NEW.currency := COALESCE(NEW.currency, 'KES');
  NEW.product_type := COALESCE(NULLIF(NEW.product_type, ''), 'product');
  NEW.status := COALESCE(NULLIF(NEW.status, ''), 'pending_approval');
  NEW.updated_at := now();
  NEW.created_at := COALESCE(NEW.created_at, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_product_images_trigger ON public.products;
CREATE TRIGGER sync_product_images_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_images();

-- Auto-fill seller details from profiles/auth when omitted
CREATE OR REPLACE FUNCTION public.fill_product_seller_details()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  profile_name TEXT;
  profile_email TEXT;
BEGIN
  IF NEW.seller_id IS NOT NULL THEN
    SELECT p.display_name, p.email
    INTO profile_name, profile_email
    FROM public.profiles p
    WHERE p.id = NEW.seller_id
    LIMIT 1;

    NEW.seller_name := COALESCE(NULLIF(NEW.seller_name, ''), profile_name, 'Alumni User');
    NEW.seller_email := COALESCE(NULLIF(NEW.seller_email, ''), profile_email);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fill_product_seller_details_trigger ON public.products;
CREATE TRIGGER fill_product_seller_details_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.fill_product_seller_details();

ANALYZE public.products;
ANALYZE public.product_categories;

COMMIT;
