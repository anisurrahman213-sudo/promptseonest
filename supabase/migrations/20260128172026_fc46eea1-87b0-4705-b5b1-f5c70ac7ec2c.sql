-- Add explicit policies to block anonymous access to sensitive tables
-- This provides defense-in-depth security

-- Block anonymous access to user_profiles (add explicit check)
CREATE POLICY "Block anonymous access to user_profiles"
ON public.user_profiles
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to payment_requests
CREATE POLICY "Block anonymous access to payment_requests"
ON public.payment_requests
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to generations
CREATE POLICY "Block anonymous access to generations"
ON public.generations
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to custom_events
CREATE POLICY "Block anonymous access to custom_events"
ON public.custom_events
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to push_subscriptions
CREATE POLICY "Block anonymous access to push_subscriptions"
ON public.push_subscriptions
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to notification_logs
CREATE POLICY "Block anonymous access to notification_logs"
ON public.notification_logs
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to user_roles
CREATE POLICY "Block anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);