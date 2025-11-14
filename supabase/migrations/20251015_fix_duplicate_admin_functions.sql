-- Fix duplicate is_super_admin function issue
-- Drop all existing versions and create a clean one

-- Drop all existing is_super_admin functions (with different signatures if any)
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);

-- Create a clean version of is_super_admin function
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

-- Also ensure is_admin function is clean and includes super_admin
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(uuid);

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;