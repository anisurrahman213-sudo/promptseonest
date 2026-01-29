-- Fix 1: notification_logs - Add explicit deny policies for INSERT/UPDATE/DELETE
-- This ensures only service role can modify notification logs (via edge functions)
CREATE POLICY "Block user inserts to notification_logs"
ON public.notification_logs
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Block user updates to notification_logs"
ON public.notification_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Block user deletes from notification_logs"
ON public.notification_logs
FOR DELETE
TO authenticated
USING (false);

-- Fix 2: user_roles - Add explicit deny policies to prevent role manipulation
-- Only service role should be able to modify roles
CREATE POLICY "Block user inserts to user_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Block user updates to user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Block user deletes from user_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- Fix 3: Create a separate private bucket for payment screenshots
-- First, update existing payment_screenshots to use a private bucket pattern
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-screenshots bucket
CREATE POLICY "Users can upload their own payment screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete payment screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND
  has_role(auth.uid(), 'admin')
);