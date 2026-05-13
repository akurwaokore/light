-- Points System with Notifications and Milestones
-- Drop existing objects if they exist
DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS points_milestones CASCADE;
DROP FUNCTION IF EXISTS award_points CASCADE;
DROP FUNCTION IF EXISTS check_milestone_notifications CASCADE;

-- Points transactions table
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points DECIMAL(10, 4) NOT NULL, -- Changed to support 0.0001 precision
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'penalty')),
  reason TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('product', 'service', 'purchase', 'sale', 'event', 'donation')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points milestones tracking
CREATE TABLE points_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_points INTEGER NOT NULL CHECK (milestone_points IN (250, 500, 750, 1000)), -- 25%, 50%, 75%, 100% of 1000
  milestone_percentage INTEGER NOT NULL CHECK (milestone_percentage IN (25, 50, 75, 100)),
  reached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, milestone_points)
);

-- Add points column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points DECIMAL(10, 4) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points_rank INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_milestones_user_id ON points_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);

-- Function to award points and check milestones
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points DECIMAL,
  p_type TEXT,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_old_points DECIMAL;
  v_new_points DECIMAL;
  v_milestone_250 BOOLEAN;
  v_milestone_500 BOOLEAN;
  v_milestone_750 BOOLEAN;
  v_milestone_1000 BOOLEAN;
BEGIN
  -- Get current points
  SELECT COALESCE(points, 0) INTO v_old_points
  FROM profiles
  WHERE id = p_user_id;
  
  -- Calculate new points
  v_new_points := v_old_points + p_points;
  
  -- Insert transaction record
  INSERT INTO points_transactions (user_id, points, type, reason, reference_id, reference_type, metadata)
  VALUES (p_user_id, p_points, p_type, p_reason, p_reference_id, p_reference_type, p_metadata)
  RETURNING id INTO v_transaction_id;
  
  -- Update user's total points
  UPDATE profiles
  SET 
    points = v_new_points,
    points_updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Check and record milestones
  -- 250 points (25%)
  IF v_old_points < 250 AND v_new_points >= 250 THEN
    INSERT INTO points_milestones (user_id, milestone_points, milestone_percentage)
    VALUES (p_user_id, 250, 25)
    ON CONFLICT (user_id, milestone_points) DO NOTHING;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      p_user_id,
      'achievement',
      'Milestone Achieved! 🎉',
      'Congratulations! You have reached 250 points (25% of 1000). Keep going!',
      '/leaderboard'
    );
  END IF;
  
  -- 500 points (50%)
  IF v_old_points < 500 AND v_new_points >= 500 THEN
    INSERT INTO points_milestones (user_id, milestone_points, milestone_percentage)
    VALUES (p_user_id, 500, 50)
    ON CONFLICT (user_id, milestone_points) DO NOTHING;
    
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      p_user_id,
      'achievement',
      'Halfway There! 🌟',
      'Amazing! You have reached 500 points (50% of 1000). You are doing great!',
      '/leaderboard'
    );
  END IF;
  
  -- 750 points (75%)
  IF v_old_points < 750 AND v_new_points >= 750 THEN
    INSERT INTO points_milestones (user_id, milestone_points, milestone_percentage)
    VALUES (p_user_id, 750, 75)
    ON CONFLICT (user_id, milestone_points) DO NOTHING;
    
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      p_user_id,
      'achievement',
      'Almost There! 🚀',
      'Fantastic! You have reached 750 points (75% of 1000). Just a little more!',
      '/leaderboard'
    );
  END IF;
  
  -- 1000 points (100%)
  IF v_old_points < 1000 AND v_new_points >= 1000 THEN
    INSERT INTO points_milestones (user_id, milestone_points, milestone_percentage)
    VALUES (p_user_id, 1000, 100)
    ON CONFLICT (user_id, milestone_points) DO NOTHING;
    
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      p_user_id,
      'achievement',
      'Goal Achieved! 🏆',
      'Congratulations! You have reached 1000 points! You are now eligible for the End Year Alumni Party gift!',
      '/leaderboard'
    );
  END IF;
  
  -- Update rankings
  PERFORM update_points_rankings();
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update rankings
CREATE OR REPLACE FUNCTION update_points_rankings() RETURNS VOID AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY points DESC, points_updated_at ASC) as rank
    FROM profiles
    WHERE points > 0
  )
  UPDATE profiles p
  SET points_rank = r.rank
  FROM ranked_users r
  WHERE p.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for points_transactions
CREATE POLICY "Users can view their own transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON points_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for points_milestones
CREATE POLICY "Users can view their own milestones"
  ON points_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all milestones"
  ON points_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Grant permissions
GRANT SELECT ON points_transactions TO authenticated;
GRANT SELECT ON points_milestones TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;
