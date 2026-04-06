
-- Create a trigger function to prevent credit manipulation by regular users
CREATE OR REPLACE FUNCTION public.protect_credits_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If credits are being changed, check if caller is admin
  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    -- Allow if caller is admin
    IF has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
    -- For non-admins, revert credits to old value
    NEW.credits := OLD.credits;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger to user_profiles
DROP TRIGGER IF EXISTS protect_credits ON user_profiles;
CREATE TRIGGER protect_credits
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_credits_column();
