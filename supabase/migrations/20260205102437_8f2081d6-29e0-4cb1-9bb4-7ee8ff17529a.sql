-- Deny anonymous access to user_profiles
CREATE POLICY "Deny anonymous access to user_profiles"
ON public.user_profiles
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to notification_logs
CREATE POLICY "Deny anonymous access to notification_logs"
ON public.notification_logs
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to user_roles
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);