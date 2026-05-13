-- ==============================================================================
-- LIGHTALUM REGISTRATION POINTS SYSTEM SETUP
-- This script:
-- 1. Retroactively awards 10 registration points to all existing users.
-- 2. Updates the handle_new_user trigger to award 10 points to new users.
-- ==============================================================================

-- 1. Retroactively award 10 points to existing users
-- This handles users who haven't already received a Registration Bonus
INSERT INTO public.points_transactions (user_id, points, type, reason, metadata)
SELECT id, 10, 'earn', 'Registration Bonus', '{"source": "retroactive_bonus"}'::jsonb
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.points_transactions pt 
  WHERE pt.user_id = p.id AND pt.reason = 'Registration Bonus'
);

-- 2. Update all profile points to reflect the new transactions
UPDATE public.profiles p
SET 
  points = COALESCE((SELECT SUM(points) FROM public.points_transactions pt WHERE pt.user_id = p.id), 0),
  points_updated_at = NOW()
WHERE id IN (
  SELECT user_id FROM public.points_transactions WHERE reason = 'Registration Bonus'
);

-- 3. Update the handle_new_user function to automatically award 10 points
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile for the new user
  INSERT INTO public.profiles (id, email, display_name, full_name, status, membership_tier)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'active',
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.full_name,
    updated_at = now();

  -- Award 10 registration points using the award_points helper function
  -- Ensure the award_points function exists first
  PERFORM public.award_points(new.id, 10, 'earn', 'Registration Bonus');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update points rankings
-- Use the ranking function if it exists, otherwise do nothing
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_points_rankings') THEN
        PERFORM public.update_points_rankings();
    END IF;
END $$;
