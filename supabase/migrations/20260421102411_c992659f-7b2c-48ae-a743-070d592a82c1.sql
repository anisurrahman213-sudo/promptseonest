-- ============================================================
-- SECURITY HARDENING (FINAL) - additive, conflict-safe
-- ============================================================

-- 1. Move pg_trgm extension out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;

-- 2. site_settings: replace open public-read with whitelisted public-read
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read whitelisted site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated users can read all site settings" ON public.site_settings;

CREATE POLICY "Public can read whitelisted site settings"
ON public.site_settings
FOR SELECT
TO anon
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
);

CREATE POLICY "Authenticated users can read all site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (true);

-- 3. Tighten storage SELECT policies — remove broad public listing,
--    keep public URL access (handled by bucket public flag), restrict listing.
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view videos" ON storage.objects;

-- Replace with scoped versions: users see own folder, admins see all,
-- hero/tutorials/feature-cards branding folders remain publicly readable.
DROP POLICY IF EXISTS "Public can read branding files in images" ON storage.objects;
CREATE POLICY "Public can read branding files in images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] IN ('hero', 'feature-cards')
);

DROP POLICY IF EXISTS "Public can read branding files in videos" ON storage.objects;
CREATE POLICY "Public can read branding files in videos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] IN ('hero', 'tutorials', 'demo')
);

DROP POLICY IF EXISTS "Users can list and read own images" ON storage.objects;
CREATE POLICY "Users can list and read own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Users can list and read own videos" ON storage.objects;
CREATE POLICY "Users can list and read own videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);
