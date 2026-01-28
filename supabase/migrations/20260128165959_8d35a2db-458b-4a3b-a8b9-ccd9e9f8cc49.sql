-- Fix 1: Add RLS to login_attempts table (currently no policies = anyone can read emails/IPs)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow Edge Functions (via service role) to read/write login_attempts
CREATE POLICY "Service role only for login_attempts"
ON public.login_attempts
FOR ALL
USING (false)
WITH CHECK (false);

-- Fix 2: Add RLS to admin_user_view (view needs security_invoker)
-- First drop and recreate the view with security_invoker
DROP VIEW IF EXISTS public.admin_user_view;

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

-- Fix 3: Secure deduct_credit - remove user_id parameter, use auth.uid() directly
CREATE OR REPLACE FUNCTION public.deduct_credit()
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  calling_user_id UUID;
BEGIN
  -- Get the authenticated user's ID
  calling_user_id := auth.uid();
  
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  SELECT credits INTO current_credits
  FROM public.user_profiles
  WHERE user_id = calling_user_id
  FOR UPDATE;
  
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.user_profiles
  SET credits = credits - 1
  WHERE user_id = calling_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 4: Add admin check to add_credits function
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id UUID, p_credits INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- CRITICAL: Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  
  -- Validate credits amount
  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'Invalid credit amount: must be positive';
  END IF;
  
  UPDATE public.user_profiles
  SET credits = credits + p_credits
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;