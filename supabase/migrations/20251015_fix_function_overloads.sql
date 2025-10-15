-- Fix duplicate function issue without dropping the functions
-- Instead, we'll ensure only one version exists by replacing them properly

-- First, let's check what versions exist by trying to create them with CREATE OR REPLACE
-- This will overwrite any existing versions without dropping dependencies

-- Recreate is_super_admin function with proper signature
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

-- Also create a version without parameters to handle both call patterns
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
  );
$$;

-- Recreate is_admin function with proper signature (includes super_admin)
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

-- Also create a version without parameters
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$;

-- Grant execute permissions for all versions
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;