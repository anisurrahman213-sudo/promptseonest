-- Trigger-only functions: revoke from everyone (triggers run as table owner)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_credits_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_user_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_submission_tracking_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_payment_request_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_user_profile() FROM PUBLIC, anon, authenticated;

-- Auth helpers: only callable from server (edge functions use service_role)
REVOKE EXECUTE ON FUNCTION public.is_account_locked(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_lock_remaining_seconds(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_emails() FROM PUBLIC, anon, authenticated;

-- Admin-only RPCs: revoke anon (function still does its own admin check)
REVOKE EXECUTE ON FUNCTION public.get_admin_user_view() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM PUBLIC, anon;

-- Two-arg deduct_credit (admin-style helper, takes user_id) — server only
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM PUBLIC, anon, authenticated;

-- Functions called by signed-in users: revoke from anon only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_credit_cost() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.deduct_credit() FROM PUBLIC, anon;