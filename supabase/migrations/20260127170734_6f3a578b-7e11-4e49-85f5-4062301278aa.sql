-- Fix security_definer_view warning by recreating with security_invoker=on
DROP VIEW IF EXISTS public.admin_user_view;

CREATE VIEW public.admin_user_view
WITH (security_invoker = on)
AS
SELECT 
  up.id,
  up.user_id,
  up.email,
  up.full_name,
  up.phone_number,
  up.credits,
  up.created_at
FROM public.user_profiles up;

-- Grant select to authenticated users
GRANT SELECT ON public.admin_user_view TO authenticated;