-- Fix 1: Remove duplicate SELECT policies on generations table
DROP POLICY IF EXISTS "Users can view their own generations" ON public.generations;
-- Keep "Users can view own generations" which has admin check included

-- Fix 2: Remove duplicate SELECT policies on user_profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
-- Keep "Users can view own profile"

-- Fix 3: Remove duplicate SELECT policies on payment_requests table
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
-- Keep "Users can view own payment requests" which has admin check included

-- Fix 4: Remove duplicate SELECT policies on notification_logs table
DROP POLICY IF EXISTS "Users can view their own notification logs" ON public.notification_logs;
-- Keep "Users can view own notification logs" which has admin check included

-- Fix 5: Remove duplicate SELECT policies on push_subscriptions table
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
-- Keep "Users can view own push subscriptions"