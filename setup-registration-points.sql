-- Setup Points System and Registration Trigger

-- 1. Create or verify the user_points table
CREATE TABLE IF NOT EXISTS public.user_points (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create or verify the point_transactions table
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- e.g., 'registration', 'post_created', 'club_joined'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view all points (for leaderboards)
DROP POLICY IF EXISTS "Points are viewable by everyone" ON public.user_points;
CREATE POLICY "Points are viewable by everyone" ON public.user_points
    FOR SELECT USING (true);

-- Users can only view their own transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.point_transactions;
CREATE POLICY "Users can view their own transactions" ON public.point_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Prevent manual updates/inserts from clients
-- Points should only be updated via secure Database Functions/Triggers or Service Role API

-- 5. Helper function to add points safely
CREATE OR REPLACE FUNCTION award_points(target_user_id UUID, points_to_add INTEGER, action_name TEXT, action_desc TEXT)
RETURNS void AS $$
BEGIN
    -- Ensure user_points record exists
    INSERT INTO public.user_points (user_id, total_points)
    VALUES (target_user_id, points_to_add)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_points = user_points.total_points + points_to_add,
        updated_at = now();

    -- Record the transaction
    INSERT INTO public.point_transactions (user_id, amount, action_type, description)
    VALUES (target_user_id, points_to_add, action_name, action_desc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Trigger: Award 10 points on new registration
-- We'll attach this to the profiles table since that's created when a user signs up
CREATE OR REPLACE FUNCTION trigger_award_registration_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already got registration points to prevent duplicates
    IF NOT EXISTS (
        SELECT 1 FROM public.point_transactions 
        WHERE user_id = NEW.id AND action_type = 'registration'
    ) THEN
        -- Award 10 points
        PERFORM award_points(NEW.id, 10, 'registration', 'Welcome bonus for registering');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then recreate it
DROP TRIGGER IF EXISTS on_profile_created_award_points ON public.profiles;
CREATE TRIGGER on_profile_created_award_points
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_award_registration_points();

-- 7. Backfill existing users who don't have registration points
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    FOR profile_record IN SELECT id FROM public.profiles
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.point_transactions 
            WHERE user_id = profile_record.id AND action_type = 'registration'
        ) THEN
            PERFORM award_points(profile_record.id, 10, 'registration', 'Welcome bonus for registering (Backfill)');
        END IF;
    END LOOP;
END $$;
