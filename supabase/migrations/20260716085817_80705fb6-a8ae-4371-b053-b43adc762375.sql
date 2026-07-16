
CREATE OR REPLACE FUNCTION public.deduct_credits_for_user(p_user_id uuid, p_count integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  credit_cost INTEGER;
  any_active_plan BOOLEAN;
  total_cost INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_count IS NULL OR p_count <= 0 THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.pricing_plans WHERE is_active = true) INTO any_active_plan;
  IF NOT any_active_plan THEN
    RETURN TRUE;
  END IF;

  credit_cost := get_credit_cost();
  IF credit_cost <= 0 THEN
    RETURN TRUE;
  END IF;

  total_cost := credit_cost * p_count;

  SELECT credits INTO current_credits
  FROM public.user_profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL OR current_credits < total_cost THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_profiles
  SET credits = credits - total_cost
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_credits_for_user(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits_for_user(uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.refund_credits_for_user(p_user_id uuid, p_count integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credit_cost INTEGER;
  any_active_plan BOOLEAN;
BEGIN
  IF p_user_id IS NULL OR p_count IS NULL OR p_count <= 0 THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.pricing_plans WHERE is_active = true) INTO any_active_plan;
  IF NOT any_active_plan THEN
    RETURN TRUE;
  END IF;

  credit_cost := get_credit_cost();
  IF credit_cost <= 0 THEN
    RETURN TRUE;
  END IF;

  UPDATE public.user_profiles
  SET credits = credits + (credit_cost * p_count)
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_credits_for_user(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits_for_user(uuid, integer) TO service_role;
