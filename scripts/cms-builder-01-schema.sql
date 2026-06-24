-- ============================================================================
-- cms-builder-01-schema.sql
-- Page-builder tree: page -> sections -> rows -> columns -> blocks.
-- Reuses existing cms_pages + cms_sections (adds builder columns). Idempotent.
-- ============================================================================

-- cms_sections already exists (page_id, section_type, section_order, content).
-- Add builder settings + a stable label.
ALTER TABLE public.cms_sections ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.cms_sections ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.cms_rows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid NOT NULL REFERENCES public.cms_sections(id) ON DELETE CASCADE,
  row_order   integer NOT NULL DEFAULT 0,
  settings    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_columns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id      uuid NOT NULL REFERENCES public.cms_rows(id) ON DELETE CASCADE,
  col_order   integer NOT NULL DEFAULT 0,
  span        integer NOT NULL DEFAULT 12 CHECK (span BETWEEN 1 AND 12),
  settings    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id   uuid NOT NULL REFERENCES public.cms_columns(id) ON DELETE CASCADE,
  block_order integer NOT NULL DEFAULT 0,
  type        text NOT NULL DEFAULT 'text'
              CHECK (type IN ('heading','text','image','button','video','spacer','divider','html','card')),
  content     jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_rows_section ON public.cms_rows(section_id);
CREATE INDEX IF NOT EXISTS idx_cms_columns_row ON public.cms_columns(row_id);
CREATE INDEX IF NOT EXISTS idx_cms_blocks_column ON public.cms_blocks(column_id);
CREATE INDEX IF NOT EXISTS idx_cms_sections_page ON public.cms_sections(page_id);

-- RLS: public read, admin write (mirrors existing cms_* policy style).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cms_rows','cms_columns','cms_blocks'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_read ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_read ON public.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_admin ON public.%I', t, t);
    EXECUTE format($f$CREATE POLICY %I_admin ON public.%I FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))$f$, t, t);
  END LOOP;
END$$;

-- Ensure a default "home" page exists so the landing page can be CMS-driven.
INSERT INTO public.cms_pages (slug, title, published)
SELECT 'home', 'Home', true
WHERE NOT EXISTS (SELECT 1 FROM public.cms_pages WHERE slug = 'home');
