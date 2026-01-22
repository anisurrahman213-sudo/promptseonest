-- Fix the overly permissive INSERT policy for notification_logs
-- Drop the existing policy and create a more secure one
DROP POLICY IF EXISTS "System can insert notification logs" ON public.notification_logs;

-- Only service role (edge functions) can insert notification logs
-- This is done by not having any user-facing INSERT policy
-- Edge functions use service role key which bypasses RLS