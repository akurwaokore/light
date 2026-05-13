-- SQL script to ensure marketplace and notifications tables are correctly set up
-- Run this in the Supabase SQL Editor

-- 1. Ensure marketplace_transactions table exists
CREATE TABLE IF NOT EXISTS marketplace_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    buyer_id UUID REFERENCES profiles(id),
    seller_id UUID REFERENCES profiles(id),
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure RLS policies are active for transactions
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Buyers can see their own transactions
-- Standard PostgreSQL does not support IF NOT EXISTS for CREATE POLICY until version 13, 
-- but Supabase usually does. However, let's use a more robust way just in case.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'marketplace_transactions' 
        AND policyname = 'Buyers can view own transactions'
    ) THEN
        CREATE POLICY "Buyers can view own transactions" 
        ON marketplace_transactions FOR SELECT 
        USING (auth.uid() = buyer_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'marketplace_transactions' 
        AND policyname = 'Sellers can view own transactions'
    ) THEN
        CREATE POLICY "Sellers can view own transactions" 
        ON marketplace_transactions FOR SELECT 
        USING (auth.uid() = seller_id);
    END IF;
END $$;

-- 3. Ensure sellers have a phone_number column in profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone_number TEXT;
    END IF;
END $$;
