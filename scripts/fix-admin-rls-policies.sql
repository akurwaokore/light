-- Fix RLS policies for admin management sections

-- 1. CLUBS - Add admin management
DROP POLICY IF EXISTS "clubs_delete_creator" ON clubs;
CREATE POLICY "clubs_delete_creator" ON clubs FOR DELETE 
  USING (auth.uid() = created_by);

CREATE POLICY "clubs_admin_all" ON clubs FOR ALL 
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- 2. JOBS - Add admin management policies
CREATE POLICY "jobs_admin_update" ON jobs FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "jobs_admin_delete" ON jobs FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- 3. DONATIONS - Add admin DELETE policy
CREATE POLICY "donations_admin_delete" ON donations FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "donations_admin_update" ON donations FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- 4. CAMPAIGNS - Add admin DELETE and full management
CREATE POLICY "campaigns_admin_delete" ON campaigns FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "campaigns_admin_all" ON campaigns FOR ALL
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- 5. COMMISSIONS - Add RLS policies for admin management
CREATE POLICY "commissions_select_admin" ON commissions FOR SELECT
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "commissions_update_admin" ON commissions FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "commissions_delete_admin" ON commissions FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- 6. PRODUCT_APPROVALS - Add RLS policies
CREATE POLICY "product_approvals_select_admin" ON product_approvals FOR SELECT
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "product_approvals_insert_admin" ON product_approvals FOR INSERT
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "product_approvals_update_admin" ON product_approvals FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- 7. PRODUCT_CATEGORIES - Add RLS policies
CREATE POLICY "product_categories_select_all" ON product_categories FOR SELECT
  USING (true);

CREATE POLICY "product_categories_admin_all" ON product_categories FOR ALL
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- 8. PROPERTY_APPROVALS - Add RLS policies
CREATE POLICY "property_approvals_select_admin" ON property_approvals FOR SELECT
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "property_approvals_insert_admin" ON property_approvals FOR INSERT
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "property_approvals_update_admin" ON property_approvals FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- 9. NEWSLETTER - Assuming newsletter table exists, add admin policies
CREATE POLICY "newsletter_admin_all" ON newsletter FOR ALL
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "newsletter_select_all" ON newsletter FOR SELECT
  USING (true);

-- 10. MARKETPLACE - Add admin management
CREATE POLICY "marketplace_admin_update" ON marketplace_listings FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "marketplace_admin_delete" ON marketplace_listings FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);
