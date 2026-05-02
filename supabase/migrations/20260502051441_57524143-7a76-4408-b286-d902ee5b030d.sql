-- Lock down submission_tracking updates: prevent users from changing immutable fields
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

  -- reviewed_at must be null or in the past (no future-dating)
  IF NEW.reviewed_at IS NOT NULL AND NEW.reviewed_at > now() THEN
    NEW.reviewed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_submission_tracking_fields_trigger ON public.submission_tracking;
CREATE TRIGGER protect_submission_tracking_fields_trigger
BEFORE UPDATE ON public.submission_tracking
FOR EACH ROW
EXECUTE FUNCTION public.protect_submission_tracking_fields();

-- Restrict EXECUTE on internal SECURITY DEFINER functions to authenticated/service_role only
REVOKE EXECUTE ON FUNCTION public.is_account_locked(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_lock_remaining_seconds(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_emails() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_view() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM PUBLIC, anon;