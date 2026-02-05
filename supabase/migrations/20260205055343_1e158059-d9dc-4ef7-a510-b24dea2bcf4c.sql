-- Add credit per generation setting
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('credit_per_generation', '1')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to get credit cost
CREATE OR REPLACE FUNCTION public.get_credit_cost()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cost_value text;
BEGIN
  SELECT setting_value INTO cost_value
  FROM public.site_settings
  WHERE setting_key = 'credit_per_generation';
  
  IF cost_value IS NULL THEN
    RETURN 1;
  END IF;
  
  RETURN COALESCE(cost_value::integer, 1);
END;
$$;

-- Update deduct_credit function to use dynamic credit cost
CREATE OR REPLACE FUNCTION public.deduct_credit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  calling_user_id UUID;
  credit_cost INTEGER;
BEGIN
  -- Get the authenticated user's ID
  calling_user_id := auth.uid();
  
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get dynamic credit cost from settings
  credit_cost := get_credit_cost();
  
  SELECT credits INTO current_credits
  FROM public.user_profiles
  WHERE user_id = calling_user_id
  FOR UPDATE;
  
  IF current_credits IS NULL OR current_credits < credit_cost THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.user_profiles
  SET credits = credits - credit_cost
  WHERE user_id = calling_user_id;
  
  RETURN TRUE;
END;
$$;