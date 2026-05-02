-- ============================================================
-- FIX 1: submission_tracking — block non-admin from changing
-- status, rejection_reason, reviewed_at via a hardened trigger
-- (the existing WITH CHECK self-subquery is bypassable).
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_submission_tracking_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can change anything
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Prevent users from reassigning ownership
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot change submission owner';
  END IF;

  -- Prevent users from re-linking to a different generation
  IF NEW.generation_id IS DISTINCT FROM OLD.generation_id THEN
    NEW.generation_id := OLD.generation_id;
  END IF;

  -- Prevent backdating submitted_at
  IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
    NEW.submitted_at := OLD.submitted_at;
  END IF;

  -- HARD-LOCK admin-only review fields for non-admin callers
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status := OLD.status;
  END IF;

  IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;

  IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    NEW.reviewed_at := OLD.reviewed_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_submission_tracking_fields_trg ON public.submission_tracking;
CREATE TRIGGER protect_submission_tracking_fields_trg
BEFORE UPDATE ON public.submission_tracking
FOR EACH ROW
EXECUTE FUNCTION public.protect_submission_tracking_fields();

-- Also attach the existing user_profile + credits + payment validation triggers
-- defensively in case they are not bound (idempotent recreation).

DROP TRIGGER IF EXISTS protect_user_profile_fields_trg ON public.user_profiles;
CREATE TRIGGER protect_user_profile_fields_trg
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_profile_fields();

DROP TRIGGER IF EXISTS protect_credits_column_trg ON public.user_profiles;
CREATE TRIGGER protect_credits_column_trg
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_credits_column();

DROP TRIGGER IF EXISTS validate_payment_request_changes_trg ON public.payment_requests;
CREATE TRIGGER validate_payment_request_changes_trg
BEFORE INSERT OR UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_payment_request_changes();

-- ============================================================
-- FIX 2: Lock down SECURITY DEFINER functions — revoke broad
-- EXECUTE from anon/authenticated where not needed.
-- ============================================================

-- Admin/internal-only RPCs: revoke from anon AND authenticated.
-- (admin checks happen inside the functions; revoking EXECUTE
-- gives defense-in-depth so they cannot even be invoked.)
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer)        FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_view()             FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_emails()                FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid)              FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_account_locked(text)           FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_lock_remaining_seconds(text)  FROM anon, authenticated, PUBLIC;

-- Admin-only RPCs need to be callable by signed-in admins via PostgREST.
-- Re-grant to authenticated; the function body still enforces has_role().
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, integer)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_view()             TO authenticated;

-- Anonymous account-lock checks happen via edge functions w/ service role.
-- Revoke from anon entirely; keep callable from service role implicitly.

-- get_credit_cost: needed by deduct_credit internally; callable by signed-in
-- users who load pricing UI. Revoke from anon.
REVOKE EXECUTE ON FUNCTION public.get_credit_cost() FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_credit_cost() TO authenticated;

-- deduct_credit() must be callable by authenticated users (it self-checks auth.uid()).
REVOKE EXECUTE ON FUNCTION public.deduct_credit()        FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid)    FROM anon, authenticated, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.deduct_credit()        TO authenticated;

-- has_role() must remain callable by anon (used inside RLS policies) — keep as-is.
-- update_updated_at_column / trigger funcs are not callable via API; no action.

-- ============================================================
-- FIX 3: notification_logs — allow users to insert their own
-- log rows (edge functions still use service role). This removes
-- the silent-failure risk while preserving privacy.
-- ============================================================

DROP POLICY IF EXISTS "Users can insert own notification logs" ON public.notification_logs;
CREATE POLICY "Users can insert own notification logs"
ON public.notification_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
