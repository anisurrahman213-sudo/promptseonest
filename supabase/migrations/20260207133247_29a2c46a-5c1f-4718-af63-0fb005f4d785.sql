-- Fix user_profiles SELECT policy to only allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure payment_requests SELECT is properly restricted
DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view own payment requests" 
ON public.payment_requests 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Ensure generations SELECT is properly restricted to own data
DROP POLICY IF EXISTS "Users can view own generations" ON public.generations;
CREATE POLICY "Users can view own generations" 
ON public.generations 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Ensure notification_logs SELECT is properly restricted
DROP POLICY IF EXISTS "Users can view own notification logs" ON public.notification_logs;
CREATE POLICY "Users can view own notification logs" 
ON public.notification_logs 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Ensure push_subscriptions SELECT is properly restricted
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);