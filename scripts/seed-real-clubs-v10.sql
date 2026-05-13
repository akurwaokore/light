-- Drop existing RBAC tables to ensure a clean state
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- 1. Create Roles table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Permissions table
CREATE TABLE public.permissions (
    id TEXT PRIMARY KEY, -- e.g. 'manage_users'
    label TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Role-Permissions junction table
CREATE TABLE public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Create User-Roles junction table
CREATE TABLE public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 5. Add creator_id to clubs if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clubs' AND column_name='creator_id') THEN
        ALTER TABLE public.clubs ADD COLUMN creator_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Basic Policies (can be refined later)
CREATE POLICY "Admins can manage roles" ON public.roles
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage permissions" ON public.permissions
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage user_roles" ON public.user_roles
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed Permissions
INSERT INTO public.permissions (id, label, description) VALUES
('manage_users', 'Manage Users', 'Can create, update and delete users'),
('manage_content', 'Manage Content', 'Full access to CMS and social feed'),
('manage_events', 'Manage Events', 'Can create and manage events'),
('manage_donations', 'Manage Donations', 'Can view and manage donations'),
('manage_jobs', 'Manage Jobs', 'Can manage job listings'),
('manage_marketplace', 'Manage Marketplace', 'Can moderate marketplace listings'),
('view_analytics', 'View Analytics', 'Can view system-wide reports and analytics'),
('manage_roles', 'Manage Roles', 'Can assign roles and permissions to users')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label;

-- Seed real location chapters and clubs, and ensure sbirzhan@gmail.com is an admin
DO $$
DECLARE
    v_admin_id UUID;
    v_super_admin_role_id UUID;
    v_content_manager_role_id UUID;
BEGIN
    -- 1. Ensure Super Admin role exists
    INSERT INTO public.roles (name, description) VALUES 
    ('super_admin', 'Full access to all system features')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_super_admin_role_id;

    -- 2. Assign all permissions to Super Admin
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_super_admin_role_id, id FROM public.permissions
    ON CONFLICT DO NOTHING;

    -- 3. Ensure Content Manager role exists
    INSERT INTO public.roles (name, description) VALUES 
    ('content_manager', 'Manage posts, events, and jobs')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_content_manager_role_id;

    -- 4. Assign specific permissions to Content Manager
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (v_content_manager_role_id, 'manage_content'),
    (v_content_manager_role_id, 'manage_events'),
    (v_content_manager_role_id, 'manage_jobs')
    ON CONFLICT DO NOTHING;

    -- 5. Ensure sbirzhan@gmail.com exists and is set as admin
    UPDATE profiles 
    SET is_admin = true, role = 'admin' 
    WHERE email = 'sbirzhan@gmail.com';

    SELECT id INTO v_admin_id FROM profiles WHERE email = 'sbirzhan@gmail.com';

    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'User sbirzhan@gmail.com not found in profiles table. Please ensure they have signed up first.';
    ELSE
        -- 6. Assign Super Admin role to user
        INSERT INTO user_roles (user_id, role_id)
        VALUES (v_admin_id, v_super_admin_role_id)
        ON CONFLICT DO NOTHING;

        -- 7. Clean up duplicates before adding unique constraint
        DELETE FROM clubs a
        USING clubs b
        WHERE a.id > b.id AND a.name = b.name;

        -- 8. Now safely add the unique constraint
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clubs_name_key') THEN
            ALTER TABLE clubs ADD CONSTRAINT clubs_name_key UNIQUE (name);
        END IF;

        -- 9. Insert/Update Real Location Chapters
        INSERT INTO clubs (name, description, category, status, members_count, creator_id)
        VALUES
            ('Nairobi Chapter', 'The largest alumni community in East Africa. Regular meetups, networking events, and mentorship programs.', 'regional', 'active', 523, v_admin_id),
            ('Mombasa Chapter', 'Coastal alumni community connecting professionals along the Kenyan coast and beyond.', 'regional', 'active', 187, v_admin_id),
            ('United Kingdom Chapter', 'Connect with fellow alumni across England, Scotland, Wales, and Northern Ireland.', 'regional', 'active', 156, v_admin_id),
            ('United States Chapter', 'Network with the vibrant American community of Light Alumni.', 'regional', 'active', 245, v_admin_id),
            ('Europe Chapter', 'Join alumni across Germany, France, Netherlands, and other European countries.', 'regional', 'active', 132, v_admin_id),
            ('Malaysia Chapter', 'Connect with Light Alumni in Malaysia and Southeast Asia.', 'regional', 'active', 89, v_admin_id)
        ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            members_count = EXCLUDED.members_count,
            creator_id = EXCLUDED.creator_id;

        -- 10. Insert/Update Real Interest-Based Groups
        INSERT INTO clubs (name, description, category, status, members_count, creator_id)
        VALUES
            ('Tech Innovators', 'For alumni in technology, engineering, and software development.', 'interest', 'active', 342, v_admin_id),
            ('Healthcare Professionals', 'Network for alumni in the medical and healthcare industry.', 'interest', 'active', 128, v_admin_id),
            ('Creative Arts & Media', 'For photographers, designers, writers, and media professionals.', 'interest', 'active', 95, v_admin_id),
            ('Entrepreneurship Circle', 'Business owners and startup founders sharing experiences and opportunities.', 'interest', 'active', 167, v_admin_id),
            ('Sports & Fitness', 'Alumni interested in athletics, football, gym, and healthy living.', 'interest', 'active', 210, v_admin_id)
        ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            members_count = EXCLUDED.members_count,
            creator_id = EXCLUDED.creator_id;
            
        RAISE NOTICE 'Real clubs and chapters seeded successfully for sbirzhan@gmail.com';
    END IF;
END $$;
