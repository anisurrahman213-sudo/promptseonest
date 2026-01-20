-- Create custom_events table for user's personal stock market events
CREATE TABLE public.custom_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date INTEGER NOT NULL CHECK (date >= 1 AND date <= 31),
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'stock',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own custom events" 
ON public.custom_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom events" 
ON public.custom_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom events" 
ON public.custom_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom events" 
ON public.custom_events 
FOR DELETE 
USING (auth.uid() = user_id);