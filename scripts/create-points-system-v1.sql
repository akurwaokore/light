-- Add points column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points_history JSONB DEFAULT '[]'::jsonb;

-- Create points_transactions table to track all point awards
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'bonus', 'deduction', 'manual')),
  reason TEXT NOT NULL,
  reference_id UUID, -- Links to product_id, transaction_id, etc.
  reference_type TEXT, -- 'product', 'transaction', 'event', etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard view for easy querying
CREATE OR REPLACE VIEW points_leaderboard AS
SELECT 
  p.id,
  p.email,
  p.display_name,
  p.photo_url,
  p.campus,
  p.graduation_year,
  p.points,
  RANK() OVER (ORDER BY p.points DESC) as rank,
  COUNT(pt.id) as total_transactions
FROM profiles p
LEFT JOIN points_transactions pt ON p.id = pt.user_id
GROUP BY p.id, p.email, p.display_name, p.photo_url, p.campus, p.graduation_year, p.points
ORDER BY p.points DESC;

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_type TEXT,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Insert points transaction
  INSERT INTO points_transactions (
    user_id, points, type, reason, reference_id, reference_type, metadata
  ) VALUES (
    p_user_id, p_points, p_type, p_reason, p_reference_id, p_reference_type, p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- Update user's total points
  UPDATE profiles 
  SET 
    points = COALESCE(points, 0) + p_points,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award points when a product is sold (transaction completed)
CREATE OR REPLACE FUNCTION award_sale_points() RETURNS TRIGGER AS $$
BEGIN
  -- Award points to seller (from transactions table)
  IF NEW.status = 'completed' AND NEW.type = 'sale' AND NEW.user_id IS NOT NULL THEN
    PERFORM award_points(
      NEW.user_id,
      50, -- 50 points for completing a sale
      'sale',
      'Product sale completed',
      NEW.id,
      'transaction',
      jsonb_build_object('amount', NEW.amount, 'product_id', NEW.product_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_sale_points
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
WHEN (NEW.status = 'completed' AND NEW.type = 'sale')
EXECUTE FUNCTION award_sale_points();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);

-- Enable RLS
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for points_transactions
CREATE POLICY "Users can view their own points transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all points transactions"
  ON points_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert points transactions"
  ON points_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Comment on tables and columns
COMMENT ON COLUMN profiles.points IS 'Total accumulated points for marketplace activity';
COMMENT ON TABLE points_transactions IS 'Tracks all point awards and deductions';
COMMENT ON VIEW points_leaderboard IS 'Ranked view of users by points';
