-- ============================================================================
-- social-v2-01-realtime.sql
-- Enable Supabase Realtime for the feed tables so clients get live updates
-- instead of polling. Idempotent (guarded adds).
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['posts','comments','post_reactions','post_shares'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       AND NOT EXISTS (
         SELECT 1 FROM pg_publication_tables
         WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
       ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Realtime publication step skipped: %', SQLERRM;
END$$;
