-- =============================================
-- FIX 1: Push Notification Credentials Security
-- =============================================

-- Drop existing policies on push_subscriptions
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;

-- Block anonymous access explicitly
CREATE POLICY "Deny anonymous access to push_subscriptions"
ON public.push_subscriptions
FOR SELECT
TO anon
USING (false);

-- Users can only view their own push subscriptions (authenticated only)
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own push subscriptions (authenticated only)
CREATE POLICY "Users can insert their own push subscriptions"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own push subscriptions (authenticated only)
CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own push subscriptions (for token refresh)
CREATE POLICY "Users can update their own push subscriptions"
ON public.push_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all subscriptions for management
CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FIX 2: User Profiles - Strengthen Policies
-- =============================================

-- Drop and recreate with explicit role specifications
DROP POLICY IF EXISTS "Deny anonymous access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.user_profiles;

-- Block ALL anonymous operations
CREATE POLICY "Deny anonymous SELECT on user_profiles"
ON public.user_profiles
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anonymous INSERT on user_profiles"
ON public.user_profiles
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous UPDATE on user_profiles"
ON public.user_profiles
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous DELETE on user_profiles"
ON public.user_profiles
FOR DELETE
TO anon
USING (false);

-- Authenticated users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Authenticated users can only update their own profile
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all user profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all profiles (for credit management)
CREATE POLICY "Admins can update all user profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FIX 3: Notification Logs - Strengthen Policies
-- =============================================

-- Drop and recreate with explicit role specifications
DROP POLICY IF EXISTS "Deny anonymous access to notification_logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can view their own notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Admins can view all notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Block user deletes from notification_logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Block user inserts to notification_logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Block user updates to notification_logs" ON public.notification_logs;

-- Block ALL anonymous operations
CREATE POLICY "Deny anonymous access to notification_logs"
ON public.notification_logs
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Authenticated users can only view their own logs
CREATE POLICY "Users can view their own notification logs"
ON public.notification_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all notification logs"
ON public.notification_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert logs (for system notifications)
CREATE POLICY "Admins can insert notification logs"
ON public.notification_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Block all user modifications (only system/admin can modify)
CREATE POLICY "Block user modifications to notification_logs"
ON public.notification_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Block user deletions from notification_logs"
ON public.notification_logs
FOR DELETE
TO authenticated
USING (false);