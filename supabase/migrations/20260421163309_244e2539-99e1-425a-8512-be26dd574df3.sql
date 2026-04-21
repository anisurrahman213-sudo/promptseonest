-- Track UI/build deployment versions so the in-app PublishChecklist
-- can verify against the real live deployment, not just localStorage.
CREATE TABLE public.deployment_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  build_time TIMESTAMP WITH TIME ZONE NOT NULL,
  version TEXT,
  notes TEXT,
  deployed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_deployment_versions_created_at
  ON public.deployment_versions (created_at DESC);

ALTER TABLE public.deployment_versions ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read the latest deployment version
CREATE POLICY "Anyone can read deployment versions"
  ON public.deployment_versions
  FOR SELECT
  USING (true);

-- Only admins can record a new deployment
CREATE POLICY "Admins can insert deployment versions"
  ON public.deployment_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update or delete deployment rows
CREATE POLICY "Admins can update deployment versions"
  ON public.deployment_versions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete deployment versions"
  ON public.deployment_versions
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));