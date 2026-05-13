-- CMS Policy Fix: Allow public reading of CMS content
DO $$ 
BEGIN 
    -- 1. cms_settings policies
    DROP POLICY IF EXISTS "Anyone can view cms settings" ON cms_settings;
    CREATE POLICY "Anyone can view cms settings" ON cms_settings FOR SELECT USING (true);

    DROP POLICY IF EXISTS "cms_settings_public_read" ON cms_settings;
    CREATE POLICY "cms_settings_public_read" ON cms_settings FOR SELECT USING (true);

    -- 2. cms_pages policies
    DROP POLICY IF EXISTS "anyone_can_view_published_pages" ON cms_pages;
    CREATE POLICY "anyone_can_view_published_pages" ON cms_pages 
        FOR SELECT USING (published = true OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

    DROP POLICY IF EXISTS "cms_pages_public_read" ON cms_pages;
    CREATE POLICY "cms_pages_public_read" ON cms_pages FOR SELECT USING (published = true);

    -- 3. cms_sections policies
    DROP POLICY IF EXISTS "anyone_can_view_sections" ON cms_sections;
    CREATE POLICY "anyone_can_view_sections" ON cms_sections FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public can view active cms sections" ON cms_sections;
    CREATE POLICY "Public can view active cms sections" ON cms_sections FOR SELECT USING (true);

    -- 4. Ensure admin can still manage everything
    DROP POLICY IF EXISTS "Admins can manage cms settings" ON cms_settings;
    CREATE POLICY "Admins can manage cms settings" ON cms_settings 
        FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

    DROP POLICY IF EXISTS "admins_can_manage_pages" ON cms_pages;
    CREATE POLICY "admins_can_manage_pages" ON cms_pages 
        FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

    DROP POLICY IF EXISTS "admins_can_manage_sections" ON cms_sections;
    CREATE POLICY "admins_can_manage_sections" ON cms_sections 
        FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

END $$;
