-- Enable RLS on admin_user_view (it's actually a view, so we need to secure the base query)
-- Since admin_user_view is a VIEW that joins auth.users with user_profiles,
-- and user_profiles already has RLS, we need to ensure the view respects RLS

-- First, let's recreate the view with security_invoker to respect RLS
DROP VIEW IF EXISTS public.admin_user_view;

CREATE VIEW public.admin_user_view
WITH (security_invoker = on)
AS
SELECT 
  up.id,
  up.user_id,
  au.email,
  up.full_name,
  up.phone_number,
  up.credits,
  up.created_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id;

-- Grant select to authenticated users (RLS on user_profiles will filter)
GRANT SELECT ON public.admin_user_view TO authenticated;