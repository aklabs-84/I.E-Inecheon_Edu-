-- Fix signup failure due to unique email conflict in profiles
-- Update handle_new_user to ignore any unique conflicts (id or email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, nickname)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'nickname'
  )
  ON CONFLICT DO NOTHING; -- Ignore conflicts on any unique constraint (id or email)

  RETURN NEW;
END;
$$;