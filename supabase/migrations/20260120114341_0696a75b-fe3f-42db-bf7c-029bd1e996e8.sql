-- Create table for feature cards on landing page
CREATE TABLE public.feature_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_cards ENABLE ROW LEVEL SECURITY;

-- Public can view active feature cards
CREATE POLICY "Anyone can view active feature cards"
  ON public.feature_cards
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage feature cards
CREATE POLICY "Admins can manage feature cards"
  ON public.feature_cards
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_feature_cards_updated_at
  BEFORE UPDATE ON public.feature_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default feature cards
INSERT INTO public.feature_cards (title, description, icon_name, display_order) VALUES
  ('AI-Powered Prompts', 'Generate professional, detailed image prompts using advanced AI vision technology', 'Sparkles', 1),
  ('SEO Metadata', 'Get optimized titles, descriptions, and 40-50 relevant tags for maximum visibility', 'Tags', 2),
  ('Bulk Processing', 'Upload and process multiple images at once with our efficient queue system', 'Image', 3),
  ('Easy Export', 'Download all your results as CSV or copy individual fields with one click', 'Download', 4),
  ('Lightning Fast', 'Get results in seconds with our optimized AI processing pipeline', 'Zap', 5),
  ('Secure & Private', 'Your images are processed securely and never stored permanently', 'Shield', 6);