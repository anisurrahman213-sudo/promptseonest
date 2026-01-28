-- Fix RLS policies: Convert from RESTRICTIVE to PERMISSIVE for proper access control
-- The issue is that RESTRICTIVE policies (Permissive: No) require ALL policies to pass
-- We need PERMISSIVE policies where ANY matching policy grants access

-- =====================
-- 1. FIX user_profiles
-- =====================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view admin_user_view" ON public.user_profiles;
DROP POLICY IF EXISTS "Block anonymous access to user_profiles" ON public.user_profiles;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user profiles" 
ON public.user_profiles FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all user profiles" 
ON public.user_profiles FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- =====================
-- 2. FIX payment_requests
-- =====================
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can create their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Block anonymous access to payment_requests" ON public.payment_requests;

CREATE POLICY "Users can view their own payment requests" 
ON public.payment_requests FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment requests" 
ON public.payment_requests FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment requests" 
ON public.payment_requests FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment requests" 
ON public.payment_requests FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- =====================
-- 3. FIX notification_logs - Add user access to their own logs
-- =====================
DROP POLICY IF EXISTS "Admins can view all notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Block anonymous access to notification_logs" ON public.notification_logs;

CREATE POLICY "Users can view their own notification logs" 
ON public.notification_logs FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification logs" 
ON public.notification_logs FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- =====================
-- 4. FIX other tables with same issue
-- =====================

-- generations
DROP POLICY IF EXISTS "Users can view their own generations" ON public.generations;
DROP POLICY IF EXISTS "Users can insert their own generations" ON public.generations;
DROP POLICY IF EXISTS "Users can delete their own generations" ON public.generations;
DROP POLICY IF EXISTS "Admins can view all generations" ON public.generations;
DROP POLICY IF EXISTS "Admins can delete any generation" ON public.generations;
DROP POLICY IF EXISTS "Block anonymous access to generations" ON public.generations;

CREATE POLICY "Users can view their own generations" 
ON public.generations FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations" 
ON public.generations FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" 
ON public.generations FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all generations" 
ON public.generations FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any generation" 
ON public.generations FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- push_subscriptions
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Block anonymous access to push_subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can view their own push subscriptions" 
ON public.push_subscriptions FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" 
ON public.push_subscriptions FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" 
ON public.push_subscriptions FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- custom_events
DROP POLICY IF EXISTS "Users can view their own custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Users can create their own custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Users can update their own custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Users can delete their own custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Block anonymous access to custom_events" ON public.custom_events;

CREATE POLICY "Users can view their own custom events" 
ON public.custom_events FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom events" 
ON public.custom_events FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom events" 
ON public.custom_events FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom events" 
ON public.custom_events FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Block anonymous access to user_roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);