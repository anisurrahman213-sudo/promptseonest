
CREATE TABLE public.keyword_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_type TEXT NOT NULL DEFAULT 'other',
  platform TEXT NOT NULL DEFAULT 'adobe_stock',
  primary_keywords TEXT[] NOT NULL DEFAULT '{}',
  secondary_keywords TEXT[] NOT NULL DEFAULT '{}',
  supporting_keywords TEXT[] NOT NULL DEFAULT '{}',
  total_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.keyword_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own keyword sets"
ON public.keyword_sets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own keyword sets"
ON public.keyword_sets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keyword sets"
ON public.keyword_sets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own keyword sets"
ON public.keyword_sets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all keyword sets"
ON public.keyword_sets FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_keyword_sets_updated_at
BEFORE UPDATE ON public.keyword_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
