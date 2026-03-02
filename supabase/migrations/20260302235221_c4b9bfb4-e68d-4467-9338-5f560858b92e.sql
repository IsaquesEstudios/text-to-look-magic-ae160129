
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to auto-finish expired auctions
CREATE OR REPLACE FUNCTION public.auto_finish_expired_auctions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE auctions
  SET status = 'finished', updated_at = now()
  WHERE status IN ('upcoming', 'active')
    AND scheduled_start <= now();
END;
$$;
