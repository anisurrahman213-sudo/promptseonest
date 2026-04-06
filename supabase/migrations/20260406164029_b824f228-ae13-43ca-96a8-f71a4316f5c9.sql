
-- Drop the existing permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create a safe UPDATE policy that prevents credit manipulation
-- Users can only update safe fields; credits must remain unchanged
CREATE POLICY "Users can update own profile safe fields"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND credits = (SELECT credits FROM user_profiles WHERE user_id = auth.uid())
  );
