-- has_role is referenced inside RLS policies on public-readable tables
-- (pricing_plans, site_settings, etc.) via OR clauses. Anon must be able to
-- evaluate it for those policies to work. The function only returns a boolean
-- and reads from user_roles which is itself RLS-protected.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;