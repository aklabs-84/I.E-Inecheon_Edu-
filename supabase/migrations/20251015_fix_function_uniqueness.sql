-- Fix function uniqueness by ensuring only one signature per function
-- We'll keep only the version with uuid parameter (with default value)

-- First, let's try to drop the parameterless versions (these might not have dependencies)
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_super_admin();

-- Now ensure we have clean, single versions with parameters
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = COALESCE(uid, auth.uid())
      AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = COALESCE(uid, auth.uid()) 
      AND role = 'super_admin'
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon, authenticated;