-- Add new membership fields for two-tier system (Annual and Lifetime)
-- Run this migration to update the profiles table

-- Add membership_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'membership_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN membership_type TEXT CHECK (membership_type IN ('annual', 'lifetime'));
  END IF;
END $$;

-- Add membership_start_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'membership_start_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN membership_start_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add membership_status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'membership_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN membership_status TEXT DEFAULT 'inactive' CHECK (membership_status IN ('active', 'expired', 'inactive'));
  END IF;
END $$;

-- Update existing membership_expiry to be nullable for lifetime members
-- (Lifetime members will have NULL expiry)

-- Create index for membership queries
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type ON profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_status ON profiles(membership_status);

-- Comment on columns
COMMENT ON COLUMN profiles.membership_type IS 'Type of membership: annual (1,000 KES/year) or lifetime (10,000 KES one-time)';
COMMENT ON COLUMN profiles.membership_start_date IS 'Date when membership was purchased';
COMMENT ON COLUMN profiles.membership_status IS 'Current status: active, expired, or inactive';
