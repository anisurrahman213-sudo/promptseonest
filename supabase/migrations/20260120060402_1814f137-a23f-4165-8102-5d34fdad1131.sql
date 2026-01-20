-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests"
ON public.payment_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update payment requests (approve/reject)
CREATE POLICY "Admins can update payment requests"
ON public.payment_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all user profiles (to add credits)
CREATE POLICY "Admins can view all user profiles"
ON public.user_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all user profiles (to add credits)
CREATE POLICY "Admins can update all user profiles"
ON public.user_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Function to add credits to user
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id UUID, p_credits INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
  SET credits = credits + p_credits
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;