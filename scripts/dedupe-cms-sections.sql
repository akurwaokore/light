-- cms_sections accumulated many duplicate rows for the same section_name
-- (e.g. ~20 "page:video-gallery" rows), which broke reads (.maybeSingle errored)
-- and made every save insert another duplicate. This keeps only the most
-- recently updated row per section_name and enforces uniqueness going forward.

-- 1. Delete older duplicates, keeping the newest row per section_name.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY section_name
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
         ) AS rn
  FROM public.cms_sections
  WHERE section_name IS NOT NULL
)
DELETE FROM public.cms_sections
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Prevent duplicates from being created again.
CREATE UNIQUE INDEX IF NOT EXISTS cms_sections_section_name_key
  ON public.cms_sections (section_name);
