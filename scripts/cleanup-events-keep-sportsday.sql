-- ============================================================================
-- cleanup-events-keep-sportsday.sql
-- Deletes ALL events except the Sports Day event (the one with an image).
-- event_registrations is ON DELETE CASCADE, so registrations clean up too.
-- Guarded: aborts (deletes nothing) if no sports event is found, so it can
-- never accidentally wipe the whole table.
--
-- Preview what WILL be kept before running:
--   SELECT id, title, image_url FROM public.events WHERE title ILIKE '%sport%';
-- ============================================================================
DO $$
DECLARE
  keeper_count int;
  deleted_count int;
BEGIN
  -- Prefer a sports event that has an image; fall back to any sports event.
  SELECT count(*) INTO keeper_count
  FROM public.events
  WHERE title ILIKE '%sport%' AND image_url IS NOT NULL AND image_url <> '';

  IF keeper_count = 0 THEN
    SELECT count(*) INTO keeper_count FROM public.events WHERE title ILIKE '%sport%';
    IF keeper_count = 0 THEN
      RAISE NOTICE 'No Sports Day event found (title ILIKE %%sport%%). Aborting — nothing deleted.';
      RETURN;
    END IF;
    -- No sports event has an image: keep all sports events.
    DELETE FROM public.events WHERE title NOT ILIKE '%sport%';
  ELSE
    -- Keep only sports events that have an image; delete everything else.
    DELETE FROM public.events
    WHERE NOT (title ILIKE '%sport%' AND image_url IS NOT NULL AND image_url <> '');
  END IF;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Kept % Sports Day event(s); deleted % other event(s).', keeper_count, deleted_count;
END$$;
