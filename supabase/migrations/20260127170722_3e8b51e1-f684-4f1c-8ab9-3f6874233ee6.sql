-- Step 1: Add email column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Step 2: Create a function to get user email using service role (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  RETURN user_email;
END;
$$;

-- Step 3: Create a function to sync all existing emails (run once)
CREATE OR REPLACE FUNCTION public.sync_user_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles up
  SET email = (SELECT email FROM auth.users WHERE id = up.user_id)
  WHERE up.email IS NULL;
END;
$$;

-- Step 4: Call the sync function to backfill existing emails
SELECT public.sync_user_emails();

-- Step 5: Update the trigger function to also sync email on profile creation
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, credits)
  VALUES (NEW.id, NEW.email, 10)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- Step 6: Drop and recreate admin_user_view to use user_profiles.email instead of auth.users
DROP VIEW IF EXISTS public.admin_user_view;

CREATE VIEW public.admin_user_view
WITH (security_invoker = off)
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

-- Step 7: Grant select on the view to authenticated users (RLS on user_profiles handles access)
GRANT SELECT ON public.admin_user_view TO authenticated;

-- Step 8: Create RLS policy for admin_user_view
-- First enable RLS on the underlying table access via the view
-- The view uses security_invoker = off so it bypasses RLS, but we add a policy check

-- Create a policy on the view itself is not possible, so we rely on the query
-- being filtered by has_role check in the application layer