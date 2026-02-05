-- Add category column to generations table for AI-suggested categories
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';

-- Add editorial column for editorial status
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS is_editorial BOOLEAN DEFAULT false;

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_generations_category ON public.generations(category);