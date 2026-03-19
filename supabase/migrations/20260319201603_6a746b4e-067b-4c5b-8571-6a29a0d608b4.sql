ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS person_type text DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS itin_ssn text,
  ADD COLUMN IF NOT EXISTS passport text,
  ADD COLUMN IF NOT EXISTS ein text;