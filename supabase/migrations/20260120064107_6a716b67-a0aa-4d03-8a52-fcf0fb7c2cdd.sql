-- Create pricing_plans table for dynamic plan management
CREATE TABLE public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_usd numeric NOT NULL DEFAULT 0,
  price_bdt numeric NOT NULL DEFAULT 0,
  period text, -- '/month', ' lifetime', null for one-time
  description text NOT NULL,
  credits text NOT NULL, -- '100 credits/month', 'Unlimited credits'
  credits_amount integer NOT NULL DEFAULT 0, -- actual number of credits to add
  features text[] NOT NULL DEFAULT '{}',
  is_free boolean NOT NULL DEFAULT false,
  is_unlimited boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read active plans
CREATE POLICY "Anyone can view active plans" 
ON public.pricing_plans 
FOR SELECT 
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage all plans" 
ON public.pricing_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_pricing_plans_updated_at
BEFORE UPDATE ON public.pricing_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.pricing_plans (name, price_usd, price_bdt, period, description, credits, credits_amount, features, is_free, is_unlimited, is_popular, sort_order) VALUES
('Free Trial', 0, 0, NULL, 'Try it out with free credits', '10 credits', 10, ARRAY['10 free credits on signup', 'AI-powered prompt generation', 'SEO optimized metadata', '40-50 relevant tags per image', 'CSV export'], true, false, false, 1),
('Lite', 9, 1080, '/month', 'For regular creators', '100 credits/month', 100, ARRAY['100 credits per month', 'Everything in Free', 'Priority processing', 'Bulk upload (up to 10 images)', 'Download history'], false, false, false, 2),
('Pro', 29, 3480, '/month', 'For power users', '500 credits/month', 500, ARRAY['500 credits per month', 'Everything in Lite', 'Faster processing', 'Bulk upload (up to 50 images)', 'CSV import & export', 'API access (coming soon)'], false, false, false, 3),
('Unlimited', 50, 6000, ' lifetime', 'Best value for professionals', 'Unlimited credits', -1, ARRAY['Unlimited metadata generation', 'Lifetime access - never expires', 'Upload up to 1000 files at once', 'Batch generation access', 'Priority support', 'All current & future features', 'No monthly fees ever'], false, true, true, 4);