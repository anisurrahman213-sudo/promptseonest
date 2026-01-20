-- Add phone number to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create a view for admin to see user info (email from auth.users)
CREATE OR REPLACE VIEW public.admin_user_view 
WITH (security_invoker=on) AS
SELECT 
  up.id,
  up.user_id,
  up.credits,
  up.phone_number,
  up.full_name,
  up.created_at,
  au.email
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id;

-- Policy for admins to view this
CREATE POLICY "Admins can view admin_user_view"
ON public.user_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));