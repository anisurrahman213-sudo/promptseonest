-- Add RLS policy for admin tutorial video uploads
CREATE POLICY "Admins can upload tutorial videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] = 'tutorials'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update tutorial videos
CREATE POLICY "Admins can update tutorial videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] = 'tutorials'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete tutorial videos
CREATE POLICY "Admins can delete tutorial videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] = 'tutorials'
  AND public.has_role(auth.uid(), 'admin')
);