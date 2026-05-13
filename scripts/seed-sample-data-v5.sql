-- First ensure all tables exist, then populate with sample data
-- This script creates sample products, services, jobs, and categories

-- ============================================
-- STEP 1: Create necessary tables if not exists
-- ============================================

-- Product categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (marketplace)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category_id UUID REFERENCES product_categories(id),
  type TEXT CHECK (type IN ('product', 'service')) DEFAULT 'product',
  images TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sold', 'expired')) DEFAULT 'pending_approval',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  views INT DEFAULT 0,
  saved_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job categories table
CREATE TABLE IF NOT EXISTS job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job listings table
CREATE TABLE IF NOT EXISTS job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT[],
  responsibilities TEXT[],
  location TEXT,
  type TEXT CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_range TEXT,
  category_id UUID REFERENCES job_categories(id),
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  skills_required TEXT[],
  benefits TEXT[],
  application_deadline TIMESTAMPTZ,
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'active', 'closed', 'rejected')) DEFAULT 'pending_approval',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  views INT DEFAULT 0,
  applications_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_poster ON job_listings(poster_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON job_listings(category_id);

-- ============================================
-- STEP 2: Insert Sample Categories
-- ============================================

-- Get the first user ID from auth.users to use as creator
-- If no users exist, create a placeholder (in production, you'd have real users)
DO $$
DECLARE
  sample_user_id UUID;
BEGIN
  -- Try to get an existing user
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  -- If no user exists, we'll skip the creator reference
  IF sample_user_id IS NULL THEN
    -- Insert product categories without creator reference
    INSERT INTO product_categories (name, description, icon) VALUES
      ('Electronics', 'Gadgets, computers, and electronic devices', 'laptop'),
      ('Services', 'Professional services and consultations', 'briefcase'),
      ('Books', 'Educational and recreational reading materials', 'book'),
      ('Clothing', 'Apparel and accessories', 'shirt'),
      ('Furniture', 'Home and office furniture', 'home'),
      ('Vehicles', 'Cars, motorcycles, and transport', 'car'),
      ('Other', 'Miscellaneous items', 'package')
    ON CONFLICT (name) DO NOTHING;

    -- Insert job categories without creator reference
    INSERT INTO job_categories (name, description, icon) VALUES
      ('Technology', 'Software development, IT, and tech roles', 'code'),
      ('Marketing', 'Digital marketing, content, and branding', 'megaphone'),
      ('Finance', 'Accounting, financial analysis, and banking', 'dollar-sign'),
      ('Healthcare', 'Medical, nursing, and healthcare services', 'heart'),
      ('Education', 'Teaching, training, and educational roles', 'graduation-cap'),
      ('Sales', 'Business development and sales positions', 'trending-up'),
      ('Design', 'Graphic design, UX/UI, and creative roles', 'palette'),
      ('Engineering', 'Mechanical, civil, and engineering roles', 'settings')
    ON CONFLICT (name) DO NOTHING;
  ELSE
    -- Insert with creator reference
    INSERT INTO product_categories (name, description, icon, created_by) VALUES
      ('Electronics', 'Gadgets, computers, and electronic devices', 'laptop', sample_user_id),
      ('Services', 'Professional services and consultations', 'briefcase', sample_user_id),
      ('Books', 'Educational and recreational reading materials', 'book', sample_user_id),
      ('Clothing', 'Apparel and accessories', 'shirt', sample_user_id),
      ('Furniture', 'Home and office furniture', 'home', sample_user_id),
      ('Vehicles', 'Cars, motorcycles, and transport', 'car', sample_user_id),
      ('Other', 'Miscellaneous items', 'package', sample_user_id)
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO job_categories (name, description, icon, created_by) VALUES
      ('Technology', 'Software development, IT, and tech roles', 'code', sample_user_id),
      ('Marketing', 'Digital marketing, content, and branding', 'megaphone', sample_user_id),
      ('Finance', 'Accounting, financial analysis, and banking', 'dollar-sign', sample_user_id),
      ('Healthcare', 'Medical, nursing, and healthcare services', 'heart', sample_user_id),
      ('Education', 'Teaching, training, and educational roles', 'graduation-cap', sample_user_id),
      ('Sales', 'Business development and sales positions', 'trending-up', sample_user_id),
      ('Design', 'Graphic design, UX/UI, and creative roles', 'palette', sample_user_id),
      ('Engineering', 'Mechanical, civil, and engineering roles', 'settings', sample_user_id)
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- STEP 3: Insert Sample Products and Services
-- ============================================

DO $$
DECLARE
  sample_user_id UUID;
  electronics_cat_id UUID;
  services_cat_id UUID;
  books_cat_id UUID;
  clothing_cat_id UUID;
BEGIN
  -- Get user and category IDs
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  SELECT id INTO electronics_cat_id FROM product_categories WHERE name = 'Electronics';
  SELECT id INTO services_cat_id FROM product_categories WHERE name = 'Services';
  SELECT id INTO books_cat_id FROM product_categories WHERE name = 'Books';
  SELECT id INTO clothing_cat_id FROM product_categories WHERE name = 'Clothing';

  IF sample_user_id IS NOT NULL THEN
    -- Insert sample products
    INSERT INTO products (seller_id, title, description, price, category_id, type, images, status, views) VALUES
      (
        sample_user_id,
        'MacBook Pro 2020',
        'Excellent condition MacBook Pro 13-inch, 16GB RAM, 512GB SSD. Perfect for developers and designers.',
        899.99,
        electronics_cat_id,
        'product',
        ARRAY['/placeholder.svg?height=300&width=400', '/placeholder.svg?height=300&width=400'],
        'approved',
        45
      ),
      (
        sample_user_id,
        'iPhone 13 Pro',
        'Lightly used iPhone 13 Pro, 256GB, Sierra Blue. Includes original box and accessories.',
        699.99,
        electronics_cat_id,
        'product',
        ARRAY['/placeholder.svg?height=300&width=400', '/placeholder.svg?height=300&width=400'],
        'approved',
        32
      ),
      (
        sample_user_id,
        'Office Desk Chair',
        'Ergonomic office chair with lumbar support. Adjustable height and armrests. Great condition.',
        149.99,
        (SELECT id FROM product_categories WHERE name = 'Furniture'),
        'product',
        ARRAY['/placeholder.svg?height=300&width=400', '/placeholder.svg?height=300&width=400'],
        'pending_approval',
        12
      ),
      (
        sample_user_id,
        'Business Textbooks Bundle',
        'Set of 5 business and economics textbooks. Great for MBA students or business professionals.',
        89.99,
        books_cat_id,
        'product',
        ARRAY['/placeholder.svg?height=300&width=400'],
        'approved',
        18
      );

    -- Insert sample services
    INSERT INTO products (seller_id, title, description, price, category_id, type, images, status, views) VALUES
      (
        sample_user_id,
        'Web Development Services',
        'Professional full-stack web development. Specializing in React, Next.js, and Node.js. Build modern, responsive websites.',
        75.00,
        services_cat_id,
        'service',
        ARRAY['/placeholder.svg?height=300&width=400', '/placeholder.svg?height=300&width=400'],
        'approved',
        67
      ),
      (
        sample_user_id,
        'Business Consulting',
        'Strategic business consulting for startups and small businesses. Marketing, operations, and growth strategies.',
        120.00,
        services_cat_id,
        'service',
        ARRAY['/placeholder.svg?height=300&width=400'],
        'approved',
        41
      ),
      (
        sample_user_id,
        'Graphic Design Services',
        'Logo design, branding, and marketing materials. 10+ years of experience in corporate and startup design.',
        60.00,
        services_cat_id,
        'service',
        ARRAY['/placeholder.svg?height=300&width=400', '/placeholder.svg?height=300&width=400'],
        'pending_approval',
        23
      ),
      (
        sample_user_id,
        'Personal Fitness Training',
        'Certified personal trainer offering customized workout plans and nutrition guidance. Online and in-person sessions available.',
        50.00,
        services_cat_id,
        'service',
        ARRAY['/placeholder.svg?height=300&width=400'],
        'approved',
        35
      );
  END IF;
END $$;

-- ============================================
-- STEP 4: Insert Sample Job Listings
-- ============================================

DO $$
DECLARE
  sample_user_id UUID;
  tech_cat_id UUID;
  marketing_cat_id UUID;
  finance_cat_id UUID;
  design_cat_id UUID;
BEGIN
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  SELECT id INTO tech_cat_id FROM job_categories WHERE name = 'Technology';
  SELECT id INTO marketing_cat_id FROM job_categories WHERE name = 'Marketing';
  SELECT id INTO finance_cat_id FROM job_categories WHERE name = 'Finance';
  SELECT id INTO design_cat_id FROM job_categories WHERE name = 'Design';

  IF sample_user_id IS NOT NULL THEN
    INSERT INTO job_listings (
      poster_id, company, title, description, requirements, responsibilities,
      location, type, salary_range, category_id, experience_level, skills_required,
      benefits, application_deadline, status, views
    ) VALUES
      (
        sample_user_id,
        'Tech Innovators Inc.',
        'Senior Full Stack Developer',
        'Join our dynamic team to build cutting-edge web applications. Work on exciting projects with modern tech stack.',
        ARRAY['5+ years experience', 'Strong React/Next.js skills', 'Node.js backend experience', 'Database design knowledge'],
        ARRAY['Develop and maintain web applications', 'Code reviews and mentoring', 'Collaborate with design team', 'Optimize application performance'],
        'Remote',
        'full-time',
        '$90,000 - $130,000',
        tech_cat_id,
        'senior',
        ARRAY['React', 'Next.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
        ARRAY['Health insurance', 'Flexible hours', 'Remote work', '401k matching'],
        NOW() + INTERVAL '30 days',
        'active',
        89
      ),
      (
        sample_user_id,
        'Digital Growth Agency',
        'Marketing Manager',
        'Lead marketing initiatives for exciting B2B and B2C clients. Drive growth through innovative campaigns.',
        ARRAY['3+ years marketing experience', 'SEO/SEM expertise', 'Analytics proficiency', 'Team leadership skills'],
        ARRAY['Develop marketing strategies', 'Manage marketing team', 'Oversee campaign execution', 'Analyze performance metrics'],
        'New York, NY',
        'full-time',
        '$70,000 - $95,000',
        marketing_cat_id,
        'mid',
        ARRAY['SEO', 'Google Analytics', 'Content Marketing', 'Social Media', 'Email Marketing'],
        ARRAY['Health insurance', 'Professional development', 'Gym membership', 'Paid time off'],
        NOW() + INTERVAL '25 days',
        'active',
        56
      ),
      (
        sample_user_id,
        'Finance Solutions Corp',
        'Financial Analyst',
        'Analyze financial data and provide insights to drive business decisions. Work with senior leadership team.',
        ARRAY['Bachelor degree in Finance', '2+ years analysis experience', 'Excel proficiency', 'Financial modeling skills'],
        ARRAY['Prepare financial reports', 'Conduct market research', 'Build financial models', 'Present findings to stakeholders'],
        'Boston, MA',
        'full-time',
        '$65,000 - $85,000',
        finance_cat_id,
        'mid',
        ARRAY['Excel', 'Financial Modeling', 'SQL', 'Data Analysis', 'PowerPoint'],
        ARRAY['Health insurance', '401k', 'Annual bonus', 'Work from home flexibility'],
        NOW() + INTERVAL '20 days',
        'active',
        43
      ),
      (
        sample_user_id,
        'Creative Studios',
        'UX/UI Designer',
        'Design beautiful and intuitive user experiences for web and mobile applications. Join our award-winning design team.',
        ARRAY['2+ years UX/UI experience', 'Strong portfolio', 'Figma proficiency', 'User research skills'],
        ARRAY['Create wireframes and prototypes', 'Conduct user research', 'Collaborate with developers', 'Maintain design system'],
        'San Francisco, CA',
        'full-time',
        '$75,000 - $100,000',
        design_cat_id,
        'mid',
        ARRAY['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems'],
        ARRAY['Health insurance', 'Creative workspace', 'Learning stipend', 'Unlimited PTO'],
        NOW() + INTERVAL '35 days',
        'active',
        71
      ),
      (
        sample_user_id,
        'StartupHub',
        'Junior Software Engineer',
        'Start your career in software development with a fast-growing startup. Learn from experienced engineers.',
        ARRAY['Bachelor degree or bootcamp graduate', 'Basic programming knowledge', 'Eagerness to learn', 'Problem-solving skills'],
        ARRAY['Write clean code', 'Fix bugs', 'Participate in code reviews', 'Learn from senior team members'],
        'Austin, TX',
        'full-time',
        '$55,000 - $70,000',
        tech_cat_id,
        'entry',
        ARRAY['JavaScript', 'Python', 'Git', 'Basic SQL'],
        ARRAY['Health insurance', 'Mentorship program', 'Learning budget', 'Snacks and coffee'],
        NOW() + INTERVAL '40 days',
        'active',
        102
      );
  END IF;
END $$;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Sample data seeded successfully! Created categories, products, services, and job listings.';
END $$;
