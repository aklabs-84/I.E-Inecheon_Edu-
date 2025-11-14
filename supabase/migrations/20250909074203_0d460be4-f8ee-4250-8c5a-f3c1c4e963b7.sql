-- Add new columns to profiles table for enhanced user information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS age_group TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS preferred_category TEXT,
ADD COLUMN IF NOT EXISTS learning_style TEXT,
ADD COLUMN IF NOT EXISTS available_time TEXT,
ADD COLUMN IF NOT EXISTS learning_purpose TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update the handle_new_user function to include name and nickname
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
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;