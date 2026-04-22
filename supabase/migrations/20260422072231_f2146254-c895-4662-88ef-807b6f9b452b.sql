-- 1. Fix deployment_versions: remove public SELECT, restrict to authenticated
DROP POLICY IF EXISTS "Anyone can read deployment versions" ON public.deployment_versions;

CREATE POLICY "Authenticated users can read deployment versions"
ON public.deployment_versions
FOR SELECT
TO authenticated
USING (true);

-- 2. Protect user_profiles email and user_id fields (in addition to existing credits protection)
CREATE OR REPLACE FUNCTION public.protect_user_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow admins to change anything
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admin users cannot change email
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.email := OLD.email;
  END IF;

  -- Non-admin users cannot change user_id
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    NEW.user_id := OLD.user_id;
  END IF;

  -- Credits protection (defense-in-depth alongside existing protect_credits_column trigger)
  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    NEW.credits := OLD.credits;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_profile_fields_trigger ON public.user_profiles;
CREATE TRIGGER protect_user_profile_fields_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_profile_fields();

-- 3. Storage: remove duplicate public-role policies on images bucket
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
-- The remaining {authenticated} policies (Authenticated users can upload images,
-- Users can delete own images, Users can update own images, Users can list and read own images)
-- already enforce auth.uid()::text = (storage.foldername(name))[1] correctly.