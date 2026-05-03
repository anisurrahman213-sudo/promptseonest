
-- 1) Fix Function Search Path Mutable for the 4 pgmq wrapper functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 2) Revoke EXECUTE from anon + authenticated on sensitive SECURITY DEFINER functions.
-- These are either admin-only, trigger functions, or internal helpers that should
-- never be callable directly from PostgREST by clients.

REVOKE EXECUTE ON FUNCTION public.get_admin_user_view() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_emails() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM anon, authenticated, PUBLIC;

-- Email queue helpers — only callable by service role / edge functions
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;

-- Trigger-only functions (should never be called directly via API)
REVOKE EXECUTE ON FUNCTION public.protect_user_profile_fields() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_credits_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_submission_tracking_fields() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_payment_request_changes() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_user_profile() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;

-- Note: deduct_credit() (no-args), is_account_locked, get_lock_remaining_seconds,
-- has_role, and get_credit_cost remain callable by authenticated/anon as they
-- are used by the client app and edge functions for legitimate purposes.
