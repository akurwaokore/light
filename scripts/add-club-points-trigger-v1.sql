-- Add trigger to award points when club reaches 10 members

CREATE OR REPLACE FUNCTION check_club_milestone()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
  club_creator_id UUID;
  already_awarded BOOLEAN;
BEGIN
  -- Get the club creator and current member count
  SELECT created_by INTO club_creator_id
  FROM clubs
  WHERE id = NEW.club_id;

  SELECT COUNT(*) INTO member_count
  FROM club_memberships
  WHERE club_id = NEW.club_id;

  -- Check if milestone award already exists
  SELECT EXISTS(
    SELECT 1 FROM points_transactions
    WHERE user_id = club_creator_id
    AND reference_id = NEW.club_id::text
    AND reference_type = 'club_milestone'
    AND type = 'earned'
  ) INTO already_awarded;

  -- Award 15 points to club creator when club reaches exactly 10 members
  IF member_count = 10 AND NOT already_awarded THEN
    PERFORM award_points(
      club_creator_id,
      15.0,
      'earned',
      'Club reached 10 members milestone',
      NEW.club_id::text,
      'club_milestone',
      jsonb_build_object('club_id', NEW.club_id, 'milestone', 10)
    );

    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      club_creator_id,
      'achievement',
      'Club Milestone Achieved! 🎉',
      'Your club reached 10 members! You earned 15 bonus points.',
      '/clubs'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS club_milestone_trigger ON club_memberships;

-- Create trigger
CREATE TRIGGER club_milestone_trigger
AFTER INSERT ON club_memberships
FOR EACH ROW
EXECUTE FUNCTION check_club_milestone();
