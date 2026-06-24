-- ============================================================================
-- seed-rbac.sql
-- Seeds real RBAC: ensures admin/super_admin roles, grants permissions to them,
-- and assigns every profiles.is_admin user the super_admin role. Defensive +
-- idempotent (guarded; only references existing permissions so it can't fail on
-- unknown NOT NULL columns).
-- NOTE: app authorization also accepts profiles.is_admin directly (see
-- lib/admin-auth.ts), so this seed makes granular roles correct but isn't
-- required for admins to function.
-- ============================================================================
DO $$
DECLARE
  super_id uuid;
  admin_id uuid;
  has_rp_unique boolean;
BEGIN
  -- 1. Ensure roles exist.
  SELECT id INTO super_id FROM public.roles WHERE name = 'super_admin';
  IF super_id IS NULL THEN
    INSERT INTO public.roles (name) VALUES ('super_admin') RETURNING id INTO super_id;
  END IF;
  SELECT id INTO admin_id FROM public.roles WHERE name = 'admin';
  IF admin_id IS NULL THEN
    INSERT INTO public.roles (name) VALUES ('admin') RETURNING id INTO admin_id;
  END IF;

  -- 2. Grant ALL existing permissions to both roles (references existing rows only).
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT super_id, p.id FROM public.permissions p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp WHERE rp.role_id = super_id AND rp.permission_id = p.id
  );
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT admin_id, p.id FROM public.permissions p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp WHERE rp.role_id = admin_id AND rp.permission_id = p.id
  );

  -- 3. Assign super_admin to every is_admin profile that lacks a role.
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT pr.id, super_id FROM public.profiles pr
  WHERE pr.is_admin = true
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = pr.id);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'seed-rbac partial: %', SQLERRM;
END$$;
