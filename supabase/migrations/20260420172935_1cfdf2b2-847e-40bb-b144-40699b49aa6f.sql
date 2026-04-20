
-- Make images and videos buckets private to prevent anonymous bucket listing
UPDATE storage.buckets SET public = false WHERE id IN ('images', 'videos');
