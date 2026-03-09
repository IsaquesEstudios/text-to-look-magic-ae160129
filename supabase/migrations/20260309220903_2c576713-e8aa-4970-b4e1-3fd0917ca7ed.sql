
CREATE OR REPLACE FUNCTION public.check_name_available(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(trim(full_name)) = lower(trim(p_name))
  )
$$;

GRANT EXECUTE ON FUNCTION public.check_name_available(text) TO anon, authenticated;
