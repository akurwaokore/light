-- Enable Row Level Security on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is staff (secretary, editor, admin, super_admin)
CREATE OR REPLACE FUNCTION is_staff(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('secretary', 'editor', 'admin', 'super_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- User Roles Policies
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

-- Products Policies
CREATE POLICY "Anyone can view approved products"
  ON products FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own draft/rejected products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id AND status IN ('draft', 'rejected'));

CREATE POLICY "Admins can update any product"
  ON products FOR UPDATE
  USING (is_admin(auth.uid()));

-- Properties Policies
CREATE POLICY "Anyone can view approved properties"
  ON properties FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all properties"
  ON properties FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can create properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own draft/rejected properties"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id AND status IN ('draft', 'rejected'));

CREATE POLICY "Admins can update any property"
  ON properties FOR UPDATE
  USING (is_admin(auth.uid()));

-- Transactions Policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (is_admin(auth.uid()));

-- Payouts Policies
CREATE POLICY "Users can view their own payouts"
  ON payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payouts"
  ON payouts FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can create payout requests"
  ON payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update payouts"
  ON payouts FOR UPDATE
  USING (is_admin(auth.uid()));

-- User Requests Policies
CREATE POLICY "Users can view their own requests"
  ON user_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view assigned requests"
  ON user_requests FOR SELECT
  USING (auth.uid() = assigned_to OR is_staff(auth.uid()));

CREATE POLICY "Users can create requests"
  ON user_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can update requests"
  ON user_requests FOR UPDATE
  USING (is_staff(auth.uid()));

-- Request Responses Policies
CREATE POLICY "Users can view responses to their requests"
  ON request_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_requests 
      WHERE id = request_responses.request_id 
      AND user_id = auth.uid()
    ) AND internal = FALSE
  );

CREATE POLICY "Staff can view all responses"
  ON request_responses FOR SELECT
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can create responses"
  ON request_responses FOR INSERT
  WITH CHECK (is_staff(auth.uid()));

-- AI Conversations Policies
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view escalated conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = escalated_to OR is_staff(auth.uid()));

CREATE POLICY "Anyone can create conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can update their own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- AI Knowledge Base Policies
CREATE POLICY "Anyone can view knowledge base"
  ON ai_knowledge_base FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage knowledge base"
  ON ai_knowledge_base FOR ALL
  USING (is_admin(auth.uid()));
