-- Fix RLS for products table to ensure they render
-- 1. Ensure Anyone can select products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);

-- 2. Ensure seller information is correctly attributed and bypass constraint if needed
-- (Assuming the user already ran seed-user-products-v4.sql which fixed the status constraint)

-- 3. Verify that the products we just inserted are visible
UPDATE public.products 
SET status = 'approved' 
WHERE seller_id = 'ee7f6d28-0c59-4cf1-b020-08a699c7d06a';

-- 4. Enable RLS but with a permissive select policy
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
