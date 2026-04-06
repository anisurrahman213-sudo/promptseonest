
-- ===== user_roles: Convert to RESTRICTIVE policies =====
DROP POLICY IF EXISTS "Block user inserts to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Block user updates to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Block user deletes from user_roles" ON user_roles;

CREATE POLICY "Restrict user inserts to user_roles"
  ON user_roles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Restrict user updates to user_roles"
  ON user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Restrict user deletes from user_roles"
  ON user_roles AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);

-- ===== login_attempts: Convert to RESTRICTIVE policy =====
DROP POLICY IF EXISTS "Service role only for login_attempts" ON login_attempts;

CREATE POLICY "Restrict all access to login_attempts"
  ON login_attempts AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);
