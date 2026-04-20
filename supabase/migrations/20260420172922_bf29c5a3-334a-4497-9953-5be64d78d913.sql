
-- =========================================
-- 1. STORAGE: Restrict uploads & listing on public buckets
-- =========================================

-- Drop any existing permissive policies on storage.objects for these buckets
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;

-- IMAGES bucket: only authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- IMAGES bucket: only authenticated users can list/view (prevents bucket enumeration)
CREATE POLICY "Authenticated users can view images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'images');

-- IMAGES bucket: users can update/delete only their own files
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- VIDEOS bucket: only authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- VIDEOS bucket: only authenticated users can list/view
CREATE POLICY "Authenticated users can view videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'videos');

-- VIDEOS bucket: users can update/delete only their own files
CREATE POLICY "Users can update own videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =========================================
-- 2. USER_PROFILES: Add restrictive INSERT policy
-- =========================================

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND credits = 10  -- Force default credits, prevent self-granting
);

-- =========================================
-- 3. GENERATIONS: Restrict UPDATE policy to authenticated only
-- =========================================

DROP POLICY IF EXISTS "Users can update their own generations" ON public.generations;

CREATE POLICY "Users can update their own generations"
ON public.generations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================================
-- 4. CREDITS PROTECTION: Strengthen via trigger (defense in depth)
-- =========================================

-- Drop existing trigger if any to recreate cleanly
DROP TRIGGER IF EXISTS protect_credits_trigger ON public.user_profiles;

-- Recreate trigger to enforce protection at DB level (independent of RLS)
CREATE TRIGGER protect_credits_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_credits_column();
