
-- 1. Restrict submission_tracking UPDATE so users cannot change admin-only fields
DROP POLICY IF EXISTS "Users can update own submissions" ON public.submission_tracking;

CREATE POLICY "Users can update own submissions"
ON public.submission_tracking
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status = (SELECT s.status FROM public.submission_tracking s WHERE s.id = submission_tracking.id)
  AND rejection_reason IS NOT DISTINCT FROM (SELECT s.rejection_reason FROM public.submission_tracking s WHERE s.id = submission_tracking.id)
  AND reviewed_at IS NOT DISTINCT FROM (SELECT s.reviewed_at FROM public.submission_tracking s WHERE s.id = submission_tracking.id)
);

-- Admins keep full update access
DROP POLICY IF EXISTS "Admins can update any submission" ON public.submission_tracking;
CREATE POLICY "Admins can update any submission"
ON public.submission_tracking
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Restrict deployment_versions SELECT to admins only
DROP POLICY IF EXISTS "Authenticated users can read deployment versions" ON public.deployment_versions;

CREATE POLICY "Admins can read deployment versions"
ON public.deployment_versions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
