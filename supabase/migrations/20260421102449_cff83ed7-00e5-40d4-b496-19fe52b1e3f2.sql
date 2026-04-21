-- Replace blanket authenticated read with whitelist + admin override
DROP POLICY IF EXISTS "Authenticated users can read all site settings" ON public.site_settings;

CREATE POLICY "Authenticated users can read whitelisted settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (
  setting_key IN (
    'hero_background_url',
    'hero_video_url',
    'site_title',
    'site_description',
    'site_logo_url',
    'site_favicon_url',
    'product_hunt_banner_url',
    'product_hunt_banner_link',
    'demo_video_url',
    'contact_email',
    'contact_whatsapp',
    'support_phone',
    'credit_per_generation',
    'free_credits_amount',
    'show_calendar',
    'show_demo_video',
    'show_product_hunt_banner'
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
