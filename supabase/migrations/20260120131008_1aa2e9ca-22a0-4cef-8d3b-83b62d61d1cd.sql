-- Allow admins to upload feature card images to the images bucket
CREATE POLICY "Admins can upload feature card images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'feature-cards'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update/replace feature card images
CREATE POLICY "Admins can update feature card images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'feature-cards'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete feature card images
CREATE POLICY "Admins can delete feature card images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'feature-cards'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);