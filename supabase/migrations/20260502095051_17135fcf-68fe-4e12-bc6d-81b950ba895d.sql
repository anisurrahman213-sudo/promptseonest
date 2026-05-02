-- Defense-in-depth: even though RLS is restrictive (USING false / WITH CHECK false),
-- explicitly revoke all table-level grants from anon and authenticated.
-- The table is only ever touched by:
--   - SECURITY DEFINER functions (is_account_locked, get_lock_remaining_seconds)
--   - Edge functions running as service role (check-login-attempt)

REVOKE ALL ON TABLE public.login_attempts FROM anon, authenticated, PUBLIC;

-- Make the intent explicit so future migrations don't accidentally re-grant.
COMMENT ON TABLE public.login_attempts IS
  'Sensitive: brute-force tracking. No direct API access. Only SECURITY DEFINER functions and the service role may read/write. RLS is restrictive (deny-all) and table grants are revoked from anon/authenticated.';
