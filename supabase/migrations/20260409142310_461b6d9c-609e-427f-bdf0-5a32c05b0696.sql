
CREATE OR REPLACE FUNCTION public.deduct_credit()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_credits INTEGER;
  calling_user_id UUID;
  credit_cost INTEGER;
  any_active_plan BOOLEAN;
BEGIN
  -- Get the authenticated user's ID
  calling_user_id := auth.uid();
  
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if any pricing plan is active
  SELECT EXISTS (
    SELECT 1 FROM public.pricing_plans WHERE is_active = true
  ) INTO any_active_plan;
  
  -- If no active plans, free mode - skip credit deduction
  IF NOT any_active_plan THEN
    RETURN TRUE;
  END IF;
  
  -- Get dynamic credit cost from settings
  credit_cost := get_credit_cost();
  
  -- If credit cost is 0, no deduction needed
  IF credit_cost = 0 THEN
    RETURN TRUE;
  END IF;
  
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
$function$;
