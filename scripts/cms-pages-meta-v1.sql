-- ============================================================================
-- cms-pages-meta-v1.sql
-- Add per-page meta_keywords + created_by so the CMS can store SEO keywords and
-- page authorship. Idempotent.
--   node scripts/db-run.mjs scripts/cms-pages-meta-v1.sql
-- ============================================================================
ALTER TABLE public.cms_pages ADD COLUMN IF NOT EXISTS meta_keywords text;
ALTER TABLE public.cms_pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
