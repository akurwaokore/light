-- ============================================================================
-- fix-points-system.sql  (v2)
-- user_points is a VIEW over profiles.points, so the 7-arg award_points
-- (updates profiles.points) already flows through to the points API. The real
-- bugs are: (1) points_transactions.reference_type CHECK rejects valid kinds
-- like 'subscription'/'share', so those awards fail; (2) the legacy 4-arg
-- award_points wrote to the user_points VIEW (errors). Idempotent.
-- ============================================================================

-- 1. Widen the reference_type vocabulary so awards stop failing the constraint.
DO $$ BEGIN
  ALTER TABLE public.points_transactions DROP CONSTRAINT IF EXISTS points_transactions_reference_type_check;
  ALTER TABLE public.points_transactions ADD CONSTRAINT points_transactions_reference_type_check
    CHECK (reference_type IS NULL OR reference_type = ANY (ARRAY[
      'product','service','purchase','sale','event','donation',
      'subscription','share','referral','registration','engagement',
      'comment','post','marketplace_purchase','adjustment','job','application'
    ]));
EXCEPTION WHEN others THEN RAISE NOTICE 'reference_type check skip: %', SQLERRM;
END$$;

-- 2. Fix the legacy 4-arg overload to write the REAL source (profiles.points)
-- behind the user_points view, plus the point_transactions ledger.
CREATE OR REPLACE FUNCTION public.award_points(
  target_user_id uuid, points_to_add integer, action_name text, action_desc text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET points = COALESCE(points, 0) + points_to_add, points_updated_at = now()
    WHERE id = target_user_id;
  INSERT INTO public.point_transactions (user_id, amount, action_type, description)
  VALUES (target_user_id, points_to_add, action_name, action_desc);
END;
$$;
