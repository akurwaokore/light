import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function runSQL() {
  const envPath = fs.existsSync(path.join(process.cwd(), ".env.local")) 
    ? path.join(process.cwd(), ".env.local")
    : path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf8");
  const env = {};
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const sql = `
-- 1. Ensure points columns exist on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points DECIMAL(10, 4) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points_rank INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Ensure points_transactions table exists
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points DECIMAL(10, 4) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'penalty', 'earned')),
  reason TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Consolidated award_points function
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
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for joining a club
CREATE OR REPLACE FUNCTION trigger_award_club_join_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Only award points if joining (not handled by API to prevent double points)
    -- We'll check if a transaction for this club and user already exists to be safe
    IF NOT EXISTS (
        SELECT 1 FROM points_transactions 
        WHERE user_id = NEW.user_id 
        AND reference_id = NEW.club_id 
        AND reference_type = 'club_join'
    ) THEN
        PERFORM award_points(NEW.user_id, 5.0, 'earned', 'Joined a club', NEW.club_id, 'club_join');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_club_joined_award_points ON public.club_memberships;
CREATE TRIGGER on_club_joined_award_points
    AFTER INSERT ON public.club_memberships
    FOR EACH ROW
    EXECUTE FUNCTION trigger_award_club_join_points();

-- 5. Trigger for creating a club (15 points)
CREATE OR REPLACE FUNCTION trigger_award_club_creation_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.creator_id IS NOT NULL THEN
        PERFORM award_points(NEW.creator_id, 15.0, 'earned', 'Created a club', NEW.id, 'club_creation');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_club_created_award_points ON public.clubs;
CREATE TRIGGER on_club_created_award_points
    AFTER INSERT ON public.clubs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_award_club_creation_points();
`;

  console.log("Applying consolidated points and club triggers...");
  
  // Use a different approach since exec_sql might not be available or correctly named
  // Try to find if there's any other way to run SQL if exec_sql fails
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error("Error applying SQL:", error.message);
    console.log("If 'exec_sql' is missing, you might need to create it first or use a different method.");
  } else {
    console.log("Successfully applied SQL!");
  }
}

runSQL().catch(console.error);
