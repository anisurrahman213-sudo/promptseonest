-- Create login_attempts table to track failed login attempts
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on email for efficient lookups
CREATE UNIQUE INDEX idx_login_attempts_email ON public.login_attempts(email);

-- Create index on locked_until for checking lock status
CREATE INDEX idx_login_attempts_locked_until ON public.login_attempts(locked_until);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow system/edge functions to manage login attempts (no direct user access)
-- Service role will handle all operations via edge function

-- Create function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT locked_until INTO lock_time
  FROM public.login_attempts
  WHERE email = LOWER(p_email);
  
  IF lock_time IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN lock_time > now();
END;
$$;

-- Create function to get remaining lock time in seconds
CREATE OR REPLACE FUNCTION public.get_lock_remaining_seconds(p_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT locked_until INTO lock_time
  FROM public.login_attempts
  WHERE email = LOWER(p_email);
  
  IF lock_time IS NULL OR lock_time <= now() THEN
    RETURN 0;
  END IF;
  
  RETURN EXTRACT(EPOCH FROM (lock_time - now()))::INTEGER;
END;
$$;