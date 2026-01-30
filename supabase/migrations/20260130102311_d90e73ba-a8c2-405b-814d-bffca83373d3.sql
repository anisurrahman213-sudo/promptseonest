-- Add media_type column to generations table to distinguish images from videos
ALTER TABLE public.generations 
ADD COLUMN media_type text NOT NULL DEFAULT 'image';

-- Update existing records based on image_name extension
UPDATE public.generations 
SET media_type = 'video' 
WHERE image_name ILIKE '%.mp4' 
   OR image_name ILIKE '%.mov' 
   OR image_name ILIKE '%.webm' 
   OR image_name ILIKE '%.avi' 
   OR image_name ILIKE '%.mkv';