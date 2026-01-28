-- Fix: admin_user_view needs RLS protection
-- The view was created with security_invoker=true but views themselves also need RLS enabled

-- Drop and recreate the view with proper setup
DROP VIEW IF EXISTS public.admin_user_view;

-- Recreate the view with security_invoker
CREATE VIEW public.admin_user_view
WITH (security_invoker = true)
AS
SELECT 
  up.id,
  up.user_id,
  up.email,
  up.phone_number,
  up.full_name,
  up.credits,
  up.created_at
FROM public.user_profiles up;

-- Grant usage to authenticated users (needed for RLS to work on views)
GRANT SELECT ON public.admin_user_view TO authenticated;

-- Revoke public access
REVOKE ALL ON public.admin_user_view FROM anon;
REVOKE ALL ON public.admin_user_view FROM public;