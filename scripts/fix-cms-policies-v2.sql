-- Safe CMS Policy Fix: Allow public reading of CMS content with existence checks
DO $$ 
BEGIN 
    -- 1. cms_settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cms_settings') THEN
        DROP POLICY IF EXISTS "Anyone can view cms settings" ON cms_settings;
        CREATE POLICY "Anyone can view cms settings" ON cms_settings FOR SELECT USING (true);

        DROP POLICY IF EXISTS "cms_settings_public_read" ON cms_settings;
        CREATE POLICY "cms_settings_public_read" ON cms_settings FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Admins can manage cms settings" ON cms_settings;
        CREATE POLICY "Admins can manage cms settings" ON cms_settings 
            FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));
    END IF;

    -- 2. cms_pages
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cms_pages') THEN
        DROP POLICY IF EXISTS "anyone_can_view_published_pages" ON cms_pages;
        CREATE POLICY "anyone_can_view_published_pages" ON cms_pages 
            FOR SELECT USING (published = true OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

        DROP POLICY IF EXISTS "cms_pages_public_read" ON cms_pages;
        CREATE POLICY "cms_pages_public_read" ON cms_pages FOR SELECT USING (published = true);
        
        DROP POLICY IF EXISTS "admins_can_manage_pages" ON cms_pages;
        CREATE POLICY "admins_can_manage_pages" ON cms_pages 
            FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));
    END IF;

    -- 3. cms_sections
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cms_sections') THEN
        DROP POLICY IF EXISTS "anyone_can_view_sections" ON cms_sections;
        CREATE POLICY "anyone_can_view_sections" ON cms_sections FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Public can view active cms sections" ON cms_sections;
        CREATE POLICY "Public can view active cms sections" ON cms_sections FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "admins_can_manage_sections" ON cms_sections;
        CREATE POLICY "admins_can_manage_sections" ON cms_sections 
            FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));
    END IF;

END $$;
