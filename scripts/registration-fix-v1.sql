-- ============================================================================
-- registration-fix-v1.sql
-- Public sign-ups were BROKEN: the on_auth_user_created trigger
-- (handle_new_user) inserted role='alumni', but profiles_role_check only allows
-- user/admin/super_admin → the profiles insert failed → the auth.users insert
-- rolled back → registration failed for everyone.
-- Fix: insert role='user' (valid), status='active', and populate both the
-- full_name/display_name and avatar_url/photo_url column pairs the app reads.
-- The first-super-admin email branch is preserved.
-- Idempotent (CREATE OR REPLACE). Apply with:
--   node scripts/db-run.mjs scripts/registration-fix-v1.sql
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
declare
  v_first_email text;
  v_role text;
  v_name text;
  v_avatar text;
begin
  v_first_email := current_setting('app.first_super_admin_email', true);
  if v_first_email IS NOT NULL AND new.email = v_first_email then
    v_role := 'super_admin';
  else
    v_role := 'user';
  end if;

  v_name := coalesce(new.raw_user_meta_data->>'full_name',
                     new.raw_user_meta_data->>'display_name',
                     split_part(new.email, '@', 1));
  v_avatar := coalesce(new.raw_user_meta_data->>'avatar_url',
                       new.raw_user_meta_data->>'photo_url');

  insert into public.profiles (id, email, full_name, display_name, avatar_url, photo_url, role, status)
  values (new.id, new.email, v_name, v_name, v_avatar, v_avatar, v_role, 'active')
  on conflict (id) do nothing;

  return new;
end $function$;
