DROP POLICY IF EXISTS "Users can update own profile safe fields" ON public.user_profiles;
CREATE POLICY "Users can update own profile safe fields" ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND credits = (SELECT credits FROM public.user_profiles WHERE user_id = auth.uid())
  AND email IS NOT DISTINCT FROM (SELECT email FROM public.user_profiles WHERE user_id = auth.uid())
  AND user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid())
);