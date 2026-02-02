-- Create tutorial_videos table
CREATE TABLE public.tutorial_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_key TEXT NOT NULL,
  description TEXT NOT NULL,
  description_key TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Play',
  duration TEXT NOT NULL DEFAULT '0:00',
  video_url TEXT,
  thumbnail_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorial_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view active tutorials
CREATE POLICY "Anyone can view active tutorials"
ON public.tutorial_videos
FOR SELECT
USING (is_active = true);

-- Admins can manage all tutorials
CREATE POLICY "Admins can manage tutorials"
ON public.tutorial_videos
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default tutorials
INSERT INTO public.tutorial_videos (title, title_key, description, description_key, icon_name, duration, display_order) VALUES
('Getting Started', 'tutorials.signupTitle', 'Learn how to create your account and set up your profile in just a few minutes', 'tutorials.signupDesc', 'UserPlus', '2:30', 1),
('Admin: Pricing Setup', 'tutorials.pricingTitle', 'For administrators: Configure pricing plans, credits, and features for your users', 'tutorials.pricingDesc', 'Settings', '4:15', 2),
('Generate Metadata', 'tutorials.metadataTitle', 'Upload images/videos and generate SEO-optimized titles, descriptions, and tags with AI', 'tutorials.metadataDesc', 'Sparkles', '5:00', 3);

-- Create trigger for updated_at
CREATE TRIGGER update_tutorial_videos_updated_at
BEFORE UPDATE ON public.tutorial_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();