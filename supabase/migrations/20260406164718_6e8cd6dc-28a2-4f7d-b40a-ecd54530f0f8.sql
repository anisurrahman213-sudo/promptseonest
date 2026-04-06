
DROP POLICY IF EXISTS "Users can update own profile safe fields" ON user_profiles;

CREATE POLICY "Users can update own profile safe fields"
  ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND credits = (SELECT credits FROM user_profiles WHERE user_id = auth.uid())
  );
