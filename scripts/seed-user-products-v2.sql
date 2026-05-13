-- Seed products and services for b.shaimardan
-- User ID: ee7f6d28-0c59-4cf1-b020-08a699c7d06a
-- User Display Name: b.shaimardan

INSERT INTO public.products (
  title, 
  description, 
  price, 
  currency, 
  category, 
  image_urls, 
  product_type, 
  status, 
  seller_id, 
  seller_name,
  created_at, 
  updated_at
) VALUES 
-- Products
(
  'Apple MacBook Pro M2', 
  'High-performance laptop with 16GB RAM and 512GB SSD. Excellent condition.', 
  250000, 
  'KES', 
  'Electronics', 
  ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8'], 
  'product', 
  'active', 
  'ee7f6d28-0c59-4cf1-b020-08a699c7d06a', 
  'b.shaimardan',
  NOW(), 
  NOW()
),
(
  'Sony WH-1000XM5 Headphones', 
  'Industry-leading noise cancelling headphones. Black color, barely used.', 
  45000, 
  'KES', 
  'Electronics', 
  ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'], 
  'product', 
  'active', 
  'ee7f6d28-0c59-4cf1-b020-08a699c7d06a', 
  'b.shaimardan',
  NOW(), 
  NOW()
),
(
  'Leather Executive Chair', 
  'Ergonomic office chair with premium leather and adjustable height.', 
  15000, 
  'KES', 
  'Home & Garden', 
  ARRAY['https://images.unsplash.com/photo-1505843490701-5be5d0b19d58'], 
  'product', 
  'active', 
  'ee7f6d28-0c59-4cf1-b020-08a699c7d06a', 
  'b.shaimardan',
  NOW(), 
  NOW()
),
-- Services
(
  'UI/UX Design Service', 
  'Professional UI/UX design for web and mobile applications. 5+ years experience.', 
  5000, 
  'KES', 
  'Services', 
  ARRAY['https://images.unsplash.com/photo-1586717791821-3f44a563dc4c'], 
  'service', 
  'active', 
  'ee7f6d28-0c59-4cf1-b020-08a699c7d06a', 
  'b.shaimardan',
  NOW(), 
  NOW()
),
(
  'Full-Stack Web Development', 
  'Custom web application development using React, Next.js, and Node.js.', 
  10000, 
  'KES', 
  'Services', 
  ARRAY['https://images.unsplash.com/photo-1498050108023-c5249f4df085'], 
  'service', 
  'active', 
  'ee7f6d28-0c59-4cf1-b020-08a699c7d06a', 
  'b.shaimardan',
  NOW(), 
  NOW()
),
(
  'Marketing Consultation', 
  'Strategic marketing advice to grow your business or startup.', 
  3500, 
  'KES', 
  'Services', 
  ARRAY['https://images.unsplash.com/photo-1460925895917-afdab827c52f'], 
  'service', 
  'active', 
  'ee7f6d28-0c59-4cf1-b020-08a699c7d06a', 
  'b.shaimardan',
  NOW(), 
  NOW()
);
