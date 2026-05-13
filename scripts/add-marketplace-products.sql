-- Add sample marketplace products for the alumni marketplace

-- First, let's insert a sample seller profile if it doesn't exist (using a system user)
INSERT INTO profiles (id, email, full_name, campus, graduation_year)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'marketplace@lightalumni.org', 'Light Alumni Store', 'Nairobi Campus', 2020)
ON CONFLICT (id) DO NOTHING;

-- Electronics
INSERT INTO products (seller_id, title, description, price, currency, category, product_type, images, status, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'MacBook Pro 2020 M1',
    'Excellent condition MacBook Pro with M1 chip, 16GB RAM, 512GB SSD. Perfect for developers and designers. Original charger and box included.',
    120000,
    'KSH',
    'electronics',
    'product',
    ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'iPhone 13 Pro 256GB',
    'Like new iPhone 13 Pro in Sierra Blue. 256GB storage, battery health 95%. Comes with original accessories and warranty.',
    85000,
    'KSH',
    'electronics',
    'product',
    ARRAY['https://images.unsplash.com/photo-1632633173522-47456de71b76?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Dell XPS 15 Laptop',
    'High-performance Dell XPS 15, Intel i7, 32GB RAM, 1TB SSD, NVIDIA GTX 1650. Ideal for heavy computing tasks.',
    95000,
    'KSH',
    'electronics',
    'product',
    ARRAY['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Samsung 4K Smart TV 55"',
    'Brand new Samsung 55-inch 4K UHD Smart TV. Crystal clear display, built-in streaming apps, voice control.',
    65000,
    'KSH',
    'electronics',
    'product',
    ARRAY['https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '5 days'
  );

-- Furniture
INSERT INTO products (seller_id, title, description, price, currency, category, product_type, images, status, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Executive Office Desk Chair',
    'Premium ergonomic office chair with lumbar support, adjustable height, and breathable mesh back. Perfect for home office.',
    18000,
    'KSH',
    'furniture',
    'product',
    ARRAY['https://images.unsplash.com/photo-1580480055273-228ba630e2f8?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Modern L-Shaped Desk',
    'Spacious L-shaped desk with cable management. Solid wood construction, perfect for dual monitor setup.',
    35000,
    'KSH',
    'furniture',
    'product',
    ARRAY['https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '4 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '3-Seater Leather Sofa',
    'Genuine leather sofa set in excellent condition. Rich brown color, comfortable cushions, minor wear. Must see!',
    45000,
    'KSH',
    'furniture',
    'product',
    ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '2 days'
  );

-- Books & Educational Materials
INSERT INTO products (seller_id, title, description, price, currency, category, product_type, images, status, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Business & Management Textbooks',
    'Complete set of business textbooks including Marketing, Finance, Strategy, and Operations Management. Great condition.',
    8500,
    'KSH',
    'books',
    'product',
    ARRAY['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Programming Books Collection',
    'Essential programming books: Clean Code, Design Patterns, Python Crash Course, JavaScript: The Good Parts.',
    6500,
    'KSH',
    'books',
    'product',
    ARRAY['https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '6 days'
  );

-- Fashion & Accessories
INSERT INTO products (seller_id, title, description, price, currency, category, product_type, images, status, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Designer Leather Handbag',
    'Authentic Michael Kors leather handbag in black. Gently used, no scratches or tears. Comes with dust bag.',
    22000,
    'KSH',
    'fashion',
    'product',
    ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Men\'s Business Suits Set',
    'Premium wool suits, perfect for corporate events. Sizes 40-42. Includes jacket, trousers, and vest. Dry cleaned.',
    15000,
    'KSH',
    'fashion',
    'product',
    ARRAY['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '4 days'
  );

-- Services
INSERT INTO products (seller_id, title, description, price, currency, category, product_type, images, status, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Web Development Services',
    'Full-stack web development for businesses and startups. React, Node.js, Python. Portfolio available. Free consultation.',
    50000,
    'KSH',
    'services',
    'service',
    ARRAY['https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Business Consulting Services',
    'Strategic business consulting for SMEs. Market research, business plans, financial projections. 10+ years experience.',
    35000,
    'KSH',
    'services',
    'service',
    ARRAY['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Professional Photography',
    'Event photography and videography services. Weddings, corporate events, graduations. Edited photos within 7 days.',
    25000,
    'KSH',
    'services',
    'service',
    ARRAY['https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Graphic Design Services',
    'Logo design, branding, marketing materials, social media graphics. Quick turnaround, unlimited revisions.',
    15000,
    'KSH',
    'services',
    'service',
    ARRAY['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '5 days'
  );

-- Vehicles
INSERT INTO products (seller_id, title, description, price, currency, category, product_type, images, status, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Toyota Corolla 2018',
    'Well-maintained Toyota Corolla 2018 model. 45,000 km, full service history, new tires. Single owner.',
    1450000,
    'KSH',
    'vehicles',
    'product',
    ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Honda CB 250cc Motorcycle',
    'Honda CB motorcycle in excellent condition. Recent service, new battery. Perfect for city commuting.',
    180000,
    'KSH',
    'vehicles',
    'product',
    ARRAY['https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=800&fit=crop&q=80'],
    'approved',
    NOW() - INTERVAL '4 days'
  );

SELECT 'Added ' || COUNT(*) || ' products to marketplace' as result FROM products;
