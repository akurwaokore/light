-- ============================================================================
-- clubs-fix-v2-points.sql
-- Joining a club failed because the trigger_award_club_join_points trigger
-- awards points with reference_type='club_join', which the
-- points_transactions_reference_type_check CHECK constraint did not allow →
-- "new row for relation points_transactions violates check constraint".
-- Widen the allowed reference types (also add 'club' + 'reaction' for hygiene).
-- Idempotent. Apply with: node scripts/db-run.mjs scripts/clubs-fix-v2-points.sql
-- ============================================================================
ALTER TABLE public.points_transactions
  DROP CONSTRAINT IF EXISTS points_transactions_reference_type_check;

ALTER TABLE public.points_transactions
  ADD CONSTRAINT points_transactions_reference_type_check
  CHECK (
    reference_type IS NULL OR reference_type = ANY (ARRAY[
      'product','service','purchase','sale','event','donation','subscription',
      'share','referral','registration','engagement','comment','post',
      'marketplace_purchase','adjustment','job','application',
      'club','club_join','reaction'
    ])
  );

-- The club-join points trigger also passed type='earned', but the type CHECK
-- only allows earn/redeem/bonus/penalty. Recreate it using the correct 'earn'.
CREATE OR REPLACE FUNCTION public.trigger_award_club_join_points()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM points_transactions
        WHERE user_id = NEW.user_id
        AND reference_id = NEW.club_id
        AND reference_type = 'club_join'
    ) THEN
        PERFORM award_points(NEW.user_id, 5.0, 'earn', 'Joined a club', NEW.club_id, 'club_join');
    END IF;
    RETURN NEW;
END;
$function$;
