ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  DROP COLUMN IF EXISTS address_zip,
  ADD COLUMN IF NOT EXISTS postal_code text;