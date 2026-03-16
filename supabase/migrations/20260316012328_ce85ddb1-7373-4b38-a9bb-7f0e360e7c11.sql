
-- Table to track login attempts (no RLS needed, accessed via security definer functions)
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

-- Index for fast lookups by email + time
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);

-- Enable RLS but no policies (only accessed via security definer)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Check if login is allowed (< 5 failed attempts in last 15 min)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    SELECT COUNT(*) FROM public.login_attempts
    WHERE lower(trim(email)) = lower(trim(p_email))
      AND success = false
      AND attempted_at > now() - interval '15 minutes'
  ) < 5
$$;

-- Record a login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email text, p_success boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success)
  VALUES (lower(trim(p_email)), p_success);

  -- Cleanup: delete attempts older than 1 hour to keep table small
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - interval '1 hour';
END;
$$;
