-- ============================================================================
-- seed-cms-home.sql
-- Seeds a starter "home" page tree (hero + features) so the CMS-driven landing
-- and the Page Builder show real content immediately. Re-runnable (clears the
-- home page's sections first). Admins can then edit it at /admin/cms/builder.
-- ============================================================================
DO $$
DECLARE
  pid uuid; sid uuid; rid uuid; cid uuid;
BEGIN
  SELECT id INTO pid FROM public.cms_pages WHERE slug = 'home';
  IF pid IS NULL THEN
    INSERT INTO public.cms_pages (slug, title, published) VALUES ('home','Home',true) RETURNING id INTO pid;
  END IF;

  DELETE FROM public.cms_sections WHERE page_id = pid;

  -- HERO section: one full-width column, heading + subtext + CTA.
  INSERT INTO public.cms_sections (page_id, section_name, section_type, section_order, settings, is_visible)
  VALUES (pid, gen_random_uuid()::text, 'hero', 0, '{"background":"linear-gradient(135deg,#0f172a,#1e293b)"}'::jsonb, true)
  RETURNING id INTO sid;
  INSERT INTO public.cms_rows (section_id, row_order) VALUES (sid, 0) RETURNING id INTO rid;
  INSERT INTO public.cms_columns (row_id, col_order, span) VALUES (rid, 0, 12) RETURNING id INTO cid;
  INSERT INTO public.cms_blocks (column_id, block_order, type, content) VALUES
    (cid, 0, 'heading', '{"text":"Welcome to the Light Alumni Network","align":"center"}'::jsonb),
    (cid, 1, 'text', '{"text":"Reconnect with classmates, find opportunities, give back, and grow together.","align":"center"}'::jsonb),
    (cid, 2, 'button', '{"label":"Join the community","href":"/auth/signup"}'::jsonb);

  -- FEATURES section: a 3-column row of cards.
  INSERT INTO public.cms_sections (page_id, section_name, section_type, section_order, settings, is_visible)
  VALUES (pid, gen_random_uuid()::text, 'features', 1, '{}'::jsonb, true)
  RETURNING id INTO sid;
  INSERT INTO public.cms_rows (section_id, row_order) VALUES (sid, 0) RETURNING id INTO rid;

  INSERT INTO public.cms_columns (row_id, col_order, span) VALUES (rid, 0, 4) RETURNING id INTO cid;
  INSERT INTO public.cms_blocks (column_id, block_order, type, content)
  VALUES (cid, 0, 'card', '{"title":"Community Feed","body":"Share updates, photos and videos with fellow alumni."}'::jsonb);

  INSERT INTO public.cms_columns (row_id, col_order, span) VALUES (rid, 1, 4) RETURNING id INTO cid;
  INSERT INTO public.cms_blocks (column_id, block_order, type, content)
  VALUES (cid, 0, 'card', '{"title":"Careers & Jobs","body":"Discover roles, upload your CV and get hired by alumni."}'::jsonb);

  INSERT INTO public.cms_columns (row_id, col_order, span) VALUES (rid, 2, 4) RETURNING id INTO cid;
  INSERT INTO public.cms_blocks (column_id, block_order, type, content)
  VALUES (cid, 0, 'card', '{"title":"Marketplace","body":"Buy and sell within a trusted alumni community."}'::jsonb);
END$$;
