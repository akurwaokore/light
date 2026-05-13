-- Fix profile status check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Ensure it allows common status values
ALTER TABLE profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('pending', 'active', 'suspended', 'rejected', 'inactive'));

-- Fix marketplace category and type constraints (from previous steps)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;

ALTER TABLE products 
ADD CONSTRAINT products_product_type_check 
CHECK (product_type IN ('product', 'service'));
