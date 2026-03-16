
-- Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Set existing admin profile to approved
UPDATE public.profiles SET status = 'approved' WHERE user_id = 'aab89099-ac94-4ae3-af0e-c0c08ad58e33';

-- Update handle_new_user to set admin as approved automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, preferred_language, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'pt'),
    CASE WHEN NEW.email = 'admin@discoveryinvestimentos.com' THEN 'approved' ELSE 'pending' END
  );
  
  IF NEW.email = 'admin@discoveryinvestimentos.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
