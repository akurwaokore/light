-- Final Marketplace Fix: Ensure visibility and data integrity
-- 1. Ensure the products table has the correct data from b.shaimardan
UPDATE public.products 
SET status = 'approved' 
WHERE seller_email = 'b.shaimardan@lis.sc.ke';

-- 2. Grant public access to products table (Essential for rendering)
GRANT SELECT ON public.products TO anon, authenticated;

-- 3. Fix RLS - most permissive select policy for debugging/initial launch
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);

-- 4. Ensure schema is public explicitly
ALTER TABLE public.products SET SCHEMA public;

-- 5. Final check on the items we want to see
SELECT count(*) FROM public.products WHERE status = 'approved';
