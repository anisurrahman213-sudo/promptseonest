-- 1. Drop old permissive INSERT policy
DROP POLICY IF EXISTS "Users can create their own payment requests" ON public.payment_requests;

-- 2. Strict INSERT policy: force status='pending', positive amount, valid method
CREATE POLICY "Users can create pending payment requests only"
ON public.payment_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND amount > 0
  AND payment_method IN ('bkash', 'nagad', 'rocket', 'bank', 'card')
  AND admin_notes IS NULL
);

-- 3. Validation trigger: prevent non-admin users from sneaking status changes via UPDATE
CREATE OR REPLACE FUNCTION public.validate_payment_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT: enforce safe defaults regardless of policy
  IF TG_OP = 'INSERT' THEN
    IF NEW.amount <= 0 THEN
      RAISE EXCEPTION 'Payment amount must be greater than zero';
    END IF;
    IF NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'New payment requests must have status = pending';
    END IF;
    IF NEW.payment_method NOT IN ('bkash', 'nagad', 'rocket', 'bank', 'card') THEN
      RAISE EXCEPTION 'Invalid payment method';
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: only admins can change protected fields
  IF TG_OP = 'UPDATE' THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Only admins can change payment status';
      END IF;
      IF NEW.amount IS DISTINCT FROM OLD.amount THEN
        RAISE EXCEPTION 'Only admins can change payment amount';
      END IF;
      IF NEW.plan_name IS DISTINCT FROM OLD.plan_name THEN
        RAISE EXCEPTION 'Only admins can change plan';
      END IF;
      IF NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
        RAISE EXCEPTION 'Only admins can change admin notes';
      END IF;
      IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Cannot change user_id';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_payment_request_changes_trigger ON public.payment_requests;
CREATE TRIGGER validate_payment_request_changes_trigger
BEFORE INSERT OR UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_payment_request_changes();