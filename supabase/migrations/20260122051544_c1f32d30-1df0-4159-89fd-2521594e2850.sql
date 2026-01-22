-- Allow admins to view all generations
CREATE POLICY "Admins can view all generations"
  ON public.generations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any generation
CREATE POLICY "Admins can delete any generation"
  ON public.generations FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));