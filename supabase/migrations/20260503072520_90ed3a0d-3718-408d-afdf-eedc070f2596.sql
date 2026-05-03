
-- Re-grant execute on functions that the client app legitimately calls.
-- These functions internally verify the caller is an admin via has_role().
GRANT EXECUTE ON FUNCTION public.get_admin_user_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, integer) TO authenticated;
