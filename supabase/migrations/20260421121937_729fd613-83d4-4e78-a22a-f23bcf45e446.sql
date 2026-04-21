-- Create submission status enum
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');

-- Submission tracking table
CREATE TABLE public.submission_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  generation_id UUID,
  image_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  status public.submission_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_submission_tracking_user_id ON public.submission_tracking(user_id);
CREATE INDEX idx_submission_tracking_platform ON public.submission_tracking(platform);
CREATE INDEX idx_submission_tracking_status ON public.submission_tracking(status);
CREATE INDEX idx_submission_tracking_generation_id ON public.submission_tracking(generation_id);

-- Enable RLS
ALTER TABLE public.submission_tracking ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own submissions"
  ON public.submission_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own submissions"
  ON public.submission_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
  ON public.submission_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions"
  ON public.submission_tracking FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE TRIGGER update_submission_tracking_updated_at
  BEFORE UPDATE ON public.submission_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();