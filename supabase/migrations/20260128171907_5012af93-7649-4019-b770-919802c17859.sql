-- Fix: Views cannot have RLS directly in PostgreSQL
-- Solution: Drop the view and create a secure table-returning function instead

-- Drop the insecure view
DROP VIEW IF EXISTS public.admin_user_view;

-- Create a secure function that only admins can call
-- This function returns user profile data only to admins
CREATE OR REPLACE FUNCTION public.get_admin_user_view()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  phone_number text,
  full_name text,
  credits integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to access this data
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.email,
    up.phone_number,
    up.full_name,
    up.credits,
    up.created_at
  FROM public.user_profiles up;
END;
$$;

-- Grant execute only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_user_view() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_view() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_view() FROM public;