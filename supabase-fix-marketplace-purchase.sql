-- SQL script to ensure marketplace transaction and notification system is fully setup
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Create marketplace_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure products table has correct status enum support
-- Note: If you get an error that the constraint already exists, you can ignore it or drop it first.
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('pending_approval', 'approved', 'rejected', 'sold', 'expired', 'active'));

-- 3. Ensure notifications table is ready for marketplace types
-- Usually notifications table already exists, but we want to make sure it handles our fields.
-- We use 'marketplace_purchase' as the type.

-- 4. Enable RLS on transactions
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Policies for marketplace_transactions
DROP POLICY IF EXISTS "Users can view their own buy transactions" ON public.marketplace_transactions;
CREATE POLICY "Users can view their own buy transactions" ON public.marketplace_transactions
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can view their own sell transactions" ON public.marketplace_transactions;
CREATE POLICY "Users can view their own sell transactions" ON public.marketplace_transactions
  FOR SELECT TO authenticated USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "System can insert transactions" ON public.marketplace_transactions;
CREATE POLICY "System can insert transactions" ON public.marketplace_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- 6. Refresh schema cache
NOTIFY pgrst, 'reload schema';
