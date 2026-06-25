-- ============================================================================
-- cms-public-read-v1.sql
-- CMS content (hero, sections, page-builder tree, settings) is the public
-- website front-end, but the cms_* tables had RLS with ONLY admin policies, so
-- unauthenticated visitors got NOTHING — the hero/sections only showed once an
-- admin was logged in. Add public SELECT policies so guests see the content.
-- Writes remain admin-only (existing policies untouched). Idempotent.
--   node scripts/db-run.mjs scripts/cms-public-read-v1.sql
-- ============================================================================

-- Content tables: world-readable.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cms_sections','cms_rows','cms_columns','cms_blocks','cms_settings','cms_menus','cms_theme','cms_assets'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_public_read', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', t || '_public_read', t);
    END IF;
  END LOOP;
END$$;

-- Pages: expose only published pages publicly (drafts stay admin-only).
DROP POLICY IF EXISTS cms_pages_public_read ON public.cms_pages;
CREATE POLICY cms_pages_public_read ON public.cms_pages
  FOR SELECT USING (published = true);
