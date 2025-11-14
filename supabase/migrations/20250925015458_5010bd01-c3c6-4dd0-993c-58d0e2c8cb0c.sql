-- CRITICAL: Fix profiles table RLS - corrected version without sequence references
-- This is a serious security vulnerability that needs immediate fixing

-- First, revoke all existing permissions and start fresh (except for service_role which is needed)
REVOKE ALL ON public.profiles FROM anon, authenticated;

-- Grant only specific necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select_own_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_secure" ON public.profiles;

-- Create bulletproof RLS policies with explicit authentication checks
CREATE POLICY "profiles_authenticated_select_own" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id = auth.uid()
);

CREATE POLICY "profiles_authenticated_select_admin" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  )
);

CREATE POLICY "profiles_authenticated_insert_own" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND id = auth.uid()
);

CREATE POLICY "profiles_authenticated_update_own" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id = auth.uid()
);

-- Ensure RLS is enabled and forced
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;