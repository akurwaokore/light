-- Create Roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY, -- e.g. 'manage_users'
    label TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Role-Permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Create User-Roles junction table
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

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

-- Seed Roles
DO $$
DECLARE
    super_admin_id UUID;
    content_manager_id UUID;
    moderator_id UUID;
BEGIN
    INSERT INTO public.roles (name, description) VALUES 
    ('super_admin', 'Full access to all system features')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO super_admin_id;

    INSERT INTO public.roles (name, description) VALUES 
    ('content_manager', 'Manage posts, events, and jobs')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO content_manager_id;

    INSERT INTO public.roles (name, description) VALUES 
    ('moderator', 'Monitor and moderate community content')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO moderator_id;

    -- Assign all permissions to Super Admin
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT super_admin_id, id FROM public.permissions
    ON CONFLICT DO NOTHING;

    -- Assign specific permissions to Content Manager
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (content_manager_id, 'manage_content'),
    (content_manager_id, 'manage_events'),
    (content_manager_id, 'manage_jobs')
    ON CONFLICT DO NOTHING;
END $$;
