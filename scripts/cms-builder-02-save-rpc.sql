-- ============================================================================
-- cms-builder-02-save-rpc.sql
-- Atomic "replace page tree": deletes the page's sections (cascade to rows/
-- columns/blocks) and rebuilds them from a JSON tree. Admin-only. Idempotent.
-- Tree shape:
-- [ { section_type, section_order, settings, content, is_visible,
--     rows: [ { row_order, settings,
--       columns: [ { col_order, span, settings,
--         blocks: [ { block_order, type, content } ] } ] } ] } ]
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cms_save_page_tree(p_page_id uuid, p_tree jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_section jsonb; v_row jsonb; v_col jsonb; v_block jsonb;
  v_section_id uuid; v_row_id uuid; v_col_id uuid;
  s_idx int := 0; r_idx int := 0; c_idx int := 0; b_idx int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Wipe existing tree for this page (cascade handles rows/columns/blocks).
  DELETE FROM cms_sections WHERE page_id = p_page_id;

  FOR v_section IN SELECT * FROM jsonb_array_elements(COALESCE(p_tree, '[]'::jsonb)) LOOP
    INSERT INTO cms_sections (page_id, section_name, section_type, section_order, content, settings, is_visible)
    VALUES (
      p_page_id,
      gen_random_uuid()::text,
      COALESCE(v_section->>'section_type', 'section'),
      COALESCE((v_section->>'section_order')::int, s_idx),
      COALESCE(v_section->'content', '{}'::jsonb),
      COALESCE(v_section->'settings', '{}'::jsonb),
      COALESCE((v_section->>'is_visible')::boolean, true)
    ) RETURNING id INTO v_section_id;
    s_idx := s_idx + 1; r_idx := 0;

    FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(v_section->'rows', '[]'::jsonb)) LOOP
      INSERT INTO cms_rows (section_id, row_order, settings)
      VALUES (v_section_id, COALESCE((v_row->>'row_order')::int, r_idx), COALESCE(v_row->'settings','{}'::jsonb))
      RETURNING id INTO v_row_id;
      r_idx := r_idx + 1; c_idx := 0;

      FOR v_col IN SELECT * FROM jsonb_array_elements(COALESCE(v_row->'columns', '[]'::jsonb)) LOOP
        INSERT INTO cms_columns (row_id, col_order, span, settings)
        VALUES (v_row_id, COALESCE((v_col->>'col_order')::int, c_idx),
                LEAST(12, GREATEST(1, COALESCE((v_col->>'span')::int, 12))),
                COALESCE(v_col->'settings','{}'::jsonb))
        RETURNING id INTO v_col_id;
        c_idx := c_idx + 1; b_idx := 0;

        FOR v_block IN SELECT * FROM jsonb_array_elements(COALESCE(v_col->'blocks', '[]'::jsonb)) LOOP
          INSERT INTO cms_blocks (column_id, block_order, type, content)
          VALUES (v_col_id, COALESCE((v_block->>'block_order')::int, b_idx),
                  COALESCE(v_block->>'type','text'),
                  COALESCE(v_block->'content','{}'::jsonb));
          b_idx := b_idx + 1;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;

  UPDATE cms_pages SET updated_at = now(), updated_by = auth.uid() WHERE id = p_page_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cms_save_page_tree(uuid, jsonb) TO authenticated;
